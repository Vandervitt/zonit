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
import { isLikelyBot } from "./bot-ua";
import type { PageCheckReport } from "./report";

/** URL 安全、剔除易混字符。 */
const ID_ALPHABET = "23456789abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ";
export const newReportId = customAlphabet(ID_ALPHABET, 21);

/**
 * 报告有两段寿命，别把它们当成一件事：
 *
 * · **软过期**（SOFT_EXPIRE_DAYS，写在 expires_at 上）——结果不再展示。
 *   页面内容会过时，被检查的站点早就改过了，继续展示旧结论是误导。
 * · **硬删除**（软过期后再 HARD_DELETE_GRACE_DAYS 天）——整行删掉，链接才真的 404。
 *
 * ⚠️ 之所以要分两段：报告链接是**发到站外去的**，一份外发链接的寿命由收件人
 * 什么时候想起来点它决定，不由我们的保留策略决定。原先软过期即删除，
 * 链接过期后直接 404——恰好是对方回头来看的那一刻给他一个死页面。
 * 保留原始 URL 就能把过期变成一次回访入口（「重新检查这个页面」）。
 */
export const SOFT_EXPIRE_DAYS = 30;
export const HARD_DELETE_GRACE_DAYS = 60;

/** 兼容旧名：写入时仍按软过期天数计算 expires_at。 */
const RETENTION_DAYS = SOFT_EXPIRE_DAYS;

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

/** page_check_reports 的查询结果行（只列出映射用到的列）。 */
interface ReportRow {
  id: string;
  input_url: string;
  final_url: string;
  locale: string;
  status: number;
  bytes: number;
  hops: number;
  findings: PageCheckReport["findings"];
  browser_verified: boolean;
  created_at: string | Date;
}

/** 查询结果行 → StoredReport。列名口径只在这里出现一次。 */
function rowToReport(row: ReportRow): StoredReport {
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
 * 读取仍在有效期内的报告。
 *
 * ⚠️ 保持「只返回未过期」的语义不变：复用缓存（findRecentReport）与浏览器实测
 * 都走这里，它们拿到过期内容是错的。要展示过期状态请用 getReportForView。
 */
export async function getReport(id: string): Promise<StoredReport | null> {
  const res = await pool.query(
    `SELECT id, input_url, final_url, host, locale, status, bytes, hops, findings,
            browser_verified, created_at
       FROM page_check_reports
      WHERE id = $1 AND expires_at > now()`,
    [id],
  );
  return res.rows[0] ? rowToReport(res.rows[0]) : null;
}

/**
 * 报告页专用读取：区分「有效」「已过期但行还在」「已被硬删除」三态。
 *
 * 过期态刻意仍然带出 inputUrl——它是把死链接变成回访入口的全部依据。
 */
export type ReportEnvelope =
  | { state: "live"; report: StoredReport }
  | { state: "expired"; id: string; inputUrl: string; createdAt: string };

export async function getReportForView(id: string): Promise<ReportEnvelope | null> {
  const res = await pool.query(
    `SELECT id, input_url, final_url, host, locale, status, bytes, hops, findings,
            browser_verified, created_at, expires_at
       FROM page_check_reports
      WHERE id = $1`,
    [id],
  );
  const row = res.rows[0];
  if (!row) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) {
    return {
      state: "expired",
      id: row.id,
      inputUrl: row.input_url,
      createdAt: new Date(row.created_at).toISOString(),
    };
  }
  return { state: "live", report: rowToReport(row) };
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

/**
 * 硬删除已过软过期宽限期的报告；供 cron 每日调用。返回删除条数。
 *
 * ⚠️ 条件是 `expires_at + 宽限期`，不是 `expires_at`。改回后者会让所有外发出去的
 * 报告链接在第 30 天变回 404——那正是本次要修的问题（见 SOFT_EXPIRE_DAYS 注释）。
 * store.test.ts 有回归守卫盯着这条 SQL。
 */
export async function pruneExpiredReports(): Promise<number> {
  const res = await pool.query(
    `DELETE FROM page_check_reports WHERE expires_at <= now() - make_interval(days => $1)`,
    [HARD_DELETE_GRACE_DAYS],
  );
  return res.rowCount ?? 0;
}

/**
 * 建一个批次并挂上已存在的报告。
 *
 * 报告先各自存好、批次只负责分组（见迁移 047 注释）——因此本函数不接收报告内容，
 * 只接收 id 列表，顺序即用户提交顺序。
 */
export async function saveBatch(input: {
  reportIds: string[];
  locale: string;
  ip: string;
}): Promise<string> {
  const id = newReportId();
  const expires = new Date(Date.now() + RETENTION_DAYS * 24 * 3600 * 1000);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO page_check_batches (id, locale, ip_hash, expires_at) VALUES ($1,$2,$3,$4)`,
      [id, input.locale, hashIp(input.ip), expires],
    );
    // 一条 INSERT 带多组值：批次最多 5 条，展开成数组参数比循环往返省事也更原子。
    await client.query(
      `INSERT INTO page_check_batch_items (batch_id, report_id, position)
       SELECT $1, rid, ord - 1
         FROM unnest($2::text[]) WITH ORDINALITY AS t(rid, ord)`,
      [id, input.reportIds],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
  return id;
}

/**
 * 读批次内的全部报告，按提交顺序。
 *
 * 报告被 cron 清理时 batch_items 会级联删除，所以这里拿到的必然是仍然存在的报告；
 * 批次本身尚未过期但报告已过期的情况下会返回空数组，由调用方按 404 处理。
 */
export async function getBatchReports(id: string): Promise<StoredReport[]> {
  const res = await pool.query(
    `SELECT r.id, r.input_url, r.final_url, r.locale, r.status, r.bytes, r.hops,
            r.findings, r.browser_verified, r.created_at
       FROM page_check_batches b
       JOIN page_check_batch_items i ON i.batch_id = b.id
       JOIN page_check_reports r ON r.id = i.report_id
      WHERE b.id = $1 AND b.expires_at > now() AND r.expires_at > now()
      ORDER BY i.position`,
    [id],
  );
  return res.rows.map(rowToReport);
}

/**
 * 对比页专用读取：与单页报告同样区分三态。
 *
 * ⚠️ **批次内只要有一条过期，整体按过期处理**。对比报告的全部价值在于
 * 「同一时点的横向对比」——混着新旧数据展示，读者会把时间差读成差异。
 */
export type BatchEnvelope =
  | { state: "live"; reports: StoredReport[] }
  | { state: "expired"; inputUrls: string[]; createdAt: string };

export async function getBatchForView(id: string): Promise<BatchEnvelope | null> {
  const res = await pool.query(
    `SELECT r.id, r.input_url, r.final_url, r.locale, r.status, r.bytes, r.hops,
            r.findings, r.browser_verified, r.created_at,
            LEAST(b.expires_at, r.expires_at) AS expires_at
       FROM page_check_batches b
       JOIN page_check_batch_items i ON i.batch_id = b.id
       JOIN page_check_reports r ON r.id = i.report_id
      WHERE b.id = $1
      ORDER BY i.position`,
    [id],
  );
  if (res.rows.length === 0) return null;
  const now = Date.now();
  const expired = res.rows.some((row) => new Date(row.expires_at).getTime() <= now);
  if (expired) {
    return {
      state: "expired",
      inputUrls: res.rows.map((row) => row.input_url as string),
      createdAt: new Date(res.rows[0].created_at).toISOString(),
    };
  }
  return { state: "live", reports: res.rows.map(rowToReport) };
}

/**
 * 硬删除已过宽限期的批次；供 cron 每日调用（items 随外键级联删除）。
 * 宽限期语义同 pruneExpiredReports。
 */
export async function pruneExpiredBatches(): Promise<number> {
  const res = await pool.query(
    `DELETE FROM page_check_batches WHERE expires_at <= now() - make_interval(days => $1)`,
    [HARD_DELETE_GRACE_DAYS],
  );
  return res.rowCount ?? 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// 浏览记录
//
// 外发时每个收件人拿到一条唯一 URL，所以「这条 URL 被打开过」就是该收件人的
// 打开信号——不需要追踪像素，不需要第三方，也不需要在邮件正文里塞任何东西。
// ─────────────────────────────────────────────────────────────────────────────

export interface Visitor {
  ip: string;
  userAgent: string | null;
}

/**
 * 记录一次报告浏览。
 *
 * ⚠️ **绝不抛错**：它跑在报告页的渲染路径上。丢一条访问记录是小事，
 * 让对方点开外发链接看到报错页是大事——代价完全不对称。
 *
 * 用 INSERT…SELECT 而不是 INSERT…VALUES 有两个用处：
 *   · 报告不存在时自然不写入，不会撞外键报错；
 *   · is_creator 直接在 SQL 里比对报告行上的 ip_hash，创建者哈希不出应用层。
 */
export async function recordReportView(reportId: string, visitor: Visitor): Promise<void> {
  await recordView("report", reportId, visitor);
}

/** 记录一次对比报告浏览。语义同 recordReportView。 */
export async function recordBatchView(batchId: string, visitor: Visitor): Promise<void> {
  await recordView("batch", batchId, visitor);
}

async function recordView(kind: "report" | "batch", id: string, visitor: Visitor): Promise<void> {
  const column = kind === "report" ? "report_id" : "batch_id";
  const table = kind === "report" ? "page_check_reports" : "page_check_batches";
  try {
    await pool.query(
      `INSERT INTO page_check_report_views (${column}, ip_hash, user_agent, is_bot, is_creator)
       SELECT s.id, $2, $3, $4, (s.ip_hash IS NOT NULL AND s.ip_hash = $2)
         FROM ${table} s
        WHERE s.id = $1`,
      [id, hashIp(visitor.ip), visitor.userAgent, isLikelyBot(visitor.userAgent)],
    );
  } catch (err) {
    console.error(`page-check view record failed (${kind} ${id}):`, err);
  }
}
