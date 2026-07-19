import pool from "@/lib/db";
import { effectivePlan, type PlanId } from "@/lib/plans";

/**
 * 取用户生效套餐（= max(plan, comp_plan)）；用户行不存在或已被禁用时返回 null。
 * 返回 null 会让上层 API 走 session_stale 401，从而使禁用用户的既有会话全面失效。
 */
export async function getUserPlanOrNull(userId: string): Promise<PlanId | null> {
  const result = await pool.query(
    "SELECT plan, comp_plan, disabled_at FROM users WHERE id = $1",
    [userId],
  );
  if (result.rows.length === 0) return null;
  const row = result.rows[0];
  if (row.disabled_at) return null;
  return effectivePlan((row.plan ?? "free") as PlanId, row.comp_plan as PlanId | null);
}

export async function getUserPlan(userId: string): Promise<PlanId> {
  return (await getUserPlanOrNull(userId)) ?? "free";
}

/** 取某落地页 owner 的生效套餐（发布页/CAPI 派发按套餐门控用）。缺失回退 free。 */
export async function getPlanByPageId(pageId: string): Promise<PlanId> {
  const result = await pool.query(
    `SELECT u.plan, u.comp_plan FROM landing_pages lp JOIN users u ON u.id = lp.user_id WHERE lp.id = $1`,
    [pageId],
  );
  const row = result.rows[0];
  if (!row) return "free";
  return effectivePlan((row.plan ?? "free") as PlanId, row.comp_plan as PlanId | null);
}
