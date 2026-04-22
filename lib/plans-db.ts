import pool from "@/lib/db";
import type { PlanId } from "@/lib/plans";

export async function getUserPlan(userId: string): Promise<PlanId> {
  const result = await pool.query("SELECT plan FROM users WHERE id = $1", [userId]);
  return (result.rows[0]?.plan ?? "free") as PlanId;
}

export async function getUserSiteCount(userId: string): Promise<number> {
  const result = await pool.query("SELECT COUNT(*) FROM sites WHERE user_id = $1", [userId]);
  return Number(result.rows[0].count);
}
