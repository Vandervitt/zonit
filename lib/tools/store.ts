// lib/tools/store.ts
//
// 自检报告的持久化。
//
// ⚠️ 报告链接是公开可分享的，**安全性完全依赖 id 不可猜测**。故：
//   · 用 customAlphabet 显式指定字母表，不用 nanoid 默认值——默认字母表含
//     `_` 与 `-`，在 URL 里虽合法但会与「看起来像连字符分隔」的直觉混淆；
//     子域那次已经因为默认字母表吃过亏，这里显式声明。
//   · 长度 21 位，剔除易混字符（0/O、1/l/I）后仍有足够熵，人工枚举不可行。
//   · DB 侧不设默认值，id 只能由应用侧生成——避免出现可枚举 id 的旁路。
import { customAlphabet } from "nanoid";
import pool from "@/lib/db";
import { createHash } from "node:crypto";
import type { PageCheckReport } from "./report";

/** URL 安全、剔除易混字符。 */
const ID_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export const newReportId = customAlphabet(ID_ALPHABET, 21);

/** 报告保留 30 天，与 cron 清理子任务一致。 */
const RETENTION_DAYS = 30;

/** IP 只存哈希，不存明文——溯源够用，泄露无害。 */
export function hashIp(ip: string): string {
  return createHash("sha256").update(`page-check:${ip}`).digest("hex").slice(0, 32);
}

export interface StoredReport extends PageCheckReport {
  id: string;
  inputUrl: string;
  locale: string;
  createdAt: string;
}

export async function saveReport(input: {
  report: PageCheckReport;
  inputUrl: string;
  host: string;
  locale: string;
  ip: string;
}): Promise<string> {
  const id = newReportId();
  const expires = new Date(Date.now() + RETENTION_DAYS * 24 * 3600 * 1000);
  await pool.query(
    `INSERT INTO page_check_reports
       (id, input_url, final_url, host, locale, status, bytes, hops, findings, browser_verified, ip_hash, expires_at)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
    [
      id,
      input.inputUrl,
      input.report.finalUrl,
      input.host,
      input.locale,
      input.report.status,
      input.report.bytes,
      input.report.hops,
      JSON.stringify(input.report.findings),
      input.report.browserVerified,
      hashIp(input.ip),
      expires,
    ],
  );
  return id;
}

export async function getReport(id: string): Promise<StoredReport | null> {
  const res = await pool.query(
    `SELECT id, input_url, final_url, host, locale, status, bytes, hops, findings,
            browser_verified, created_at
       FROM page_check_reports
      WHERE id = $1 AND expires_at > now()`,
    [id],
  );
  const row = res.rows[0];
  if (!row) return null;
  return {
    id: row.id,
    inputUrl: row.input_url,
    finalUrl: row.final_url,
    locale: row.locale,
    status: row.status,
    bytes: row.bytes,
    hops: row.hops,
    findings: row.findings,
    browserVerified: row.browser_verified,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

/**
 * 同一 URL 的近期报告（缓存窗口内直接复用，不重复抓取对方站点）。
 * 这既省我们的资源，也是对被检查站点的基本礼貌。
 */
export async function findRecentReport(
  inputUrl: string,
  locale: string,
  withinMs: number,
): Promise<StoredReport | null> {
  const since = new Date(Date.now() - withinMs);
  const res = await pool.query(
    `SELECT id FROM page_check_reports
      WHERE input_url = $1 AND locale = $2 AND created_at > $3 AND expires_at > now()
      ORDER BY created_at DESC LIMIT 1`,
    [inputUrl, locale, since],
  );
  return res.rows[0] ? getReport(res.rows[0].id) : null;
}

/** 清理过期报告；供 cron 每日调用。返回删除条数。 */
export async function pruneExpiredReports(): Promise<number> {
  const res = await pool.query(`DELETE FROM page_check_reports WHERE expires_at <= now()`);
  return res.rowCount ?? 0;
}
