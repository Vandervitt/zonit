// lib/rate-limit-db.ts
// 跨实例限频（落库滑动窗口）。
//
// 为什么不用进程内内存：serverless 每个实例各算各的，实例一多限频就接近失效——
// 攻击者不需要绕过，扩容会替他绕过。
import { createHash } from "node:crypto";
import pool from "@/lib/db";

/** 计数行保留时长：远大于任何窗口即可，只为让清理有明确边界。 */
const RETENTION_HOURS = 24;

/**
 * 计数键：`用途:加盐哈希(IP)`。
 * **不存原始 IP**——限频只需要「是不是同一个来源」，不需要知道是谁。
 * 盐取自现成的服务端密钥，缺失时退化为固定串（本地开发够用，生产必有 NEXTAUTH_SECRET）。
 */
export function bucketKey(scope: string, ip: string): string {
  const salt = process.env.NEXTAUTH_SECRET ?? "zapbridge-dev-salt";
  return `${scope}:${createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32)}`;
}

/**
 * 记一笔并判断窗口内是否超限。一次往返完成，超限返回 false。
 *
 * **DB 故障时放行**：限频是防滥用的，不是防故障的；让它在库抖动时拦下真实留资，
 * 等于亲手制造 PR #124 修掉的那类线索损失。
 */
export async function allowRequest(bucket: string, opts: { windowMs: number; max: number }): Promise<boolean> {
  try {
    const res = await pool.query(
      `WITH ins AS (
         INSERT INTO rate_limit_hits (bucket) VALUES ($1)
       )
       SELECT COUNT(*)::int AS n
         FROM rate_limit_hits
        WHERE bucket = $1
          AND hit_at > NOW() - ($2::bigint * INTERVAL '1 millisecond')`,
      [bucket, opts.windowMs],
    );
    // 本次自己那笔在 CTE 里插入，不计入这条 SELECT 的可见快照，故与 max 比较用 >=。
    return (res.rows[0]?.n ?? 0) < opts.max;
  } catch (err) {
    console.error("[rate-limit] 计数失败，放行本次请求:", err);
    return true;
  }
}

/** 清理过期计数行（cron 用）。 */
export async function pruneRateLimitHits(): Promise<number> {
  const res = await pool.query(
    `DELETE FROM rate_limit_hits WHERE hit_at < NOW() - ($1::bigint * INTERVAL '1 hour')`,
    [RETENTION_HOURS],
  );
  return res.rowCount ?? 0;
}
