import pool from "@/lib/db";
import type { PlanId } from "@/lib/plans";

export interface AdminUserPatch {
  compPlan?: PlanId | null;              // null = 取消赠送
  compPlanExpiresAt?: string | null;     // ISO；null = 永久；取消赠送时随之置空
  role?: "USER" | "SUPER_ADMIN";
  disabled?: boolean;
}

/** 超管更新用户运营字段；返回是否命中行。调用方负责鉴权与自我保护校验。 */
export async function updateUserAdminFields(userId: string, patch: AdminUserPatch): Promise<boolean> {
  const set: string[] = [];
  const values: unknown[] = [];
  let i = 1;
  if (patch.compPlan !== undefined) { set.push(`comp_plan = $${i++}`); values.push(patch.compPlan); }
  if (patch.compPlanExpiresAt !== undefined) { set.push(`comp_plan_expires_at = $${i++}`); values.push(patch.compPlanExpiresAt); }
  if (patch.role !== undefined) { set.push(`role = $${i++}`); values.push(patch.role); }
  if (patch.disabled !== undefined) {
    set.push(patch.disabled ? `disabled_at = COALESCE(disabled_at, NOW())` : `disabled_at = NULL`);
  }
  if (set.length === 0) return false;
  values.push(userId);
  const result = await pool.query(
    `UPDATE users SET ${set.join(", ")} WHERE id = $${i} RETURNING id`,
    values,
  );
  return result.rows.length > 0;
}

export interface AdminUserDetail {
  id: string;
  name: string | null;
  email: string;
  plan: PlanId;
  comp_plan: PlanId | null;
  comp_plan_expires_at: string | null;
  role: string;
  disabled_at: string | null;
  invited_at: string | null;
  created_at: string;
  ls_customer_id: string | null;
  leads_count: number;
  pages: { id: string; name: string; status: string; slug: string | null; bound_domain: string | null }[];
}

/** 用户详情：基础信息 + 名下落地页（含绑定域名）+ 线索总数。不存在返回 null。 */
export async function getUserAdminDetail(userId: string): Promise<AdminUserDetail | null> {
  const userRes = await pool.query(
    `SELECT id, name, email, plan, comp_plan, comp_plan_expires_at, role, disabled_at, invited_at, created_at, ls_customer_id
       FROM users WHERE id = $1`,
    [userId],
  );
  if (userRes.rows.length === 0) return null;
  const pagesRes = await pool.query(
    `SELECT lp.id, lp.name, lp.status, lp.slug, d.domain AS bound_domain
       FROM landing_pages lp
       LEFT JOIN LATERAL (
         SELECT domain FROM domains
          WHERE landing_page_id = lp.id AND enabled = true AND verified = true LIMIT 1
       ) d ON true
     WHERE lp.user_id = $1 ORDER BY lp.updated_at DESC`,
    [userId],
  );
  const leadsRes = await pool.query(
    `SELECT COUNT(*)::int AS count FROM leads l
       JOIN landing_pages lp ON lp.id = l.page_id
     WHERE lp.user_id = $1`,
    [userId],
  );
  return {
    ...userRes.rows[0],
    leads_count: leadsRes.rows[0].count,
    pages: pagesRes.rows,
  };
}
