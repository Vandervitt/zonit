// lib/tools/sandbox-budget.ts
//
// Vercel Sandbox 的月度用量守卫。
//
// ⚠️ 与 lib/rate-limit-db.ts 的 allowRequest **语义相反，故不复用它**：
//   · 限频在 DB 故障时**放行**——它防的是滥用，不该因库抖动拦下真实留资；
//   · 预算守卫在 DB 故障时必须**拒绝**——放行的代价是打爆 Hobby 额度，
//     而 Hobby 超额后沙箱创建会被暂停到下个计费周期（功能死一个月，不是扣钱）。
//
// 两种失败方向的代价完全不对称：
//   拒绝的代价 = 这一次退回静态判定（用户仍拿到报告，只是标「疑似」）
//   放行的代价 = 整个功能挂掉一个月
// 所以这里 fail-closed，且阈值刻意留出余量。

import pool from "@/lib/db";

/**
 * 月度上限。Hobby 档 Sandbox Creations 为 5,000/月，此处取 4,000——
 * 留 1,000 给快照保活 cron、重试，以及账号上其他潜在用途。
 * 不能等 Vercel 自己的额度耗尽：那是硬暂停，会连带影响别的功能。
 */
const MONTHLY_LIMIT = 4_000;
const BUCKET = "sandbox-create";
const WINDOW_MS = 30 * 24 * 3600 * 1000;

export interface BudgetDecision {
  allowed: boolean;
  /** 已用次数；DB 故障时为 null（此时 allowed 必为 false）。 */
  used: number | null;
  reason?: "over_limit" | "counter_unavailable";
}

/**
 * 记一笔并判断是否还在预算内。
 * 返回 allowed=false 时调用方必须退回静态判定，而不是报错给用户——
 * 用户拿到的报告仍然有用，只是那一条标「疑似」而非「实测」。
 */
export async function consumeSandboxBudget(): Promise<BudgetDecision> {
  try {
    const res = await pool.query(
      `WITH ins AS (
         INSERT INTO rate_limit_hits (bucket) VALUES ($1)
       )
       SELECT COUNT(*)::int AS n
         FROM rate_limit_hits
        WHERE bucket = $1
          AND hit_at > NOW() - ($2::bigint * INTERVAL '1 millisecond')`,
      [BUCKET, WINDOW_MS],
    );
    const used = res.rows[0]?.n ?? 0;
    if (used >= MONTHLY_LIMIT) {
      return { allowed: false, used, reason: "over_limit" };
    }
    return { allowed: true, used };
  } catch (err) {
    // fail-closed：数不清就不花钱。见文件头对代价不对称的说明。
    console.error("[sandbox-budget] 计数失败，本次退回静态判定:", err);
    return { allowed: false, used: null, reason: "counter_unavailable" };
  }
}

/** 只读查询当月用量，供运维观察，不记账。 */
export async function sandboxBudgetUsed(): Promise<number | null> {
  try {
    const res = await pool.query(
      `SELECT COUNT(*)::int AS n FROM rate_limit_hits
        WHERE bucket = $1 AND hit_at > NOW() - ($2::bigint * INTERVAL '1 millisecond')`,
      [BUCKET, WINDOW_MS],
    );
    return res.rows[0]?.n ?? 0;
  } catch {
    return null;
  }
}

export const SANDBOX_MONTHLY_LIMIT = MONTHLY_LIMIT;
