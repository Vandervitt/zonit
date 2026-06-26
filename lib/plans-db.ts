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
