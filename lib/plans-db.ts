import pool from "@/lib/db";
import type { PlanId } from "@/lib/plans";

/**
 * 取用户套餐；用户行不存在时返回 null（用于区分「会话有效但用户已不在库」的情况，
 * 如本地库重置后旧 JWT 仍指向已消失的 user.id）。
 */
export async function getUserPlanOrNull(userId: string): Promise<PlanId | null> {
  const result = await pool.query("SELECT plan FROM users WHERE id = $1", [userId]);
  if (result.rows.length === 0) return null;
  return (result.rows[0].plan ?? "free") as PlanId;
}

export async function getUserPlan(userId: string): Promise<PlanId> {
  return (await getUserPlanOrNull(userId)) ?? "free";
}

/** 取某落地页 owner 的套餐（发布页/CAPI 派发按套餐门控用）。缺失回退 free。 */
export async function getPlanByPageId(pageId: string): Promise<PlanId> {
  const result = await pool.query(
    `SELECT u.plan FROM landing_pages lp JOIN users u ON u.id = lp.user_id WHERE lp.id = $1`,
    [pageId],
  );
  return (result.rows[0]?.plan ?? "free") as PlanId;
}
