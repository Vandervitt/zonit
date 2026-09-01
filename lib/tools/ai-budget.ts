// lib/tools/ai-budget.ts
//
// AI 辅助判断的月度用量守卫。
//
// 自检器对匿名开放（它是获客入口，主力用户就是未登录的陌生人），所以这条路径
// 的调用量不受账号套餐约束，只受每 IP 限频约束（见 app/api/tools/page-check/route.ts
// 的 5/时、20/天）。限频挡得住单个 IP，挡不住分布式的量，因此再叠一层全局月度上限。
//
// ⚠️ 与 lib/rate-limit-db.ts 的 allowRequest **语义相反，故不复用它**：
//   · 限频在 DB 故障时放行——它防的是滥用，不该因库抖动拦下真实用户；
//   · 预算守卫在 DB 故障时必须拒绝——放行的代价是账单不封顶。
// 与 sandbox-budget.ts 同一套理由，但**故意不合并成公共函数**：两者的上限、
// 窗口与超限后果各自独立演进，合并会让改一个的阈值悄悄影响另一个。
//
// 超预算的代价是这次报告少几条 AI 结论（用户仍拿到完整的 A 档报告），
// 所以这里退回是安全的，不需要报错给用户。
import pool from "@/lib/db";

/** 月度调用上限。单次调用只送 8K 字符正文、返回三个枚举，单价极低，故给得比沙箱宽。 */
const MONTHLY_LIMIT = 20_000;
const BUCKET = "ai-page-check";
const WINDOW_MS = 30 * 24 * 3600 * 1000;

export interface AiBudgetDecision {
  allowed: boolean;
  /** 已用次数；DB 故障时为 null（此时 allowed 必为 false）。 */
  used: number | null;
  reason?: "over_limit" | "counter_unavailable";
}

/** 记一笔并判断是否还在预算内。allowed=false 时调用方跳过 AI，不报错。 */
export async function consumeAiCheckBudget(): Promise<AiBudgetDecision> {
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
    if (used >= MONTHLY_LIMIT) return { allowed: false, used, reason: "over_limit" };
    return { allowed: true, used };
  } catch (err) {
    // fail-closed：数不清就不花钱。
    console.error("[ai-budget] 计数失败，本次跳过 AI 判断:", err);
    return { allowed: false, used: null, reason: "counter_unavailable" };
  }
}

/** 只读查询当月用量，供运维观察，不记账。 */
export async function aiCheckBudgetUsed(): Promise<number | null> {
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
