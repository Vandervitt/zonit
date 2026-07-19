import pool from "@/lib/db";
import { effectivePlan, activeCompPlan, type PlanId } from "@/lib/plans";
import { SuperAdminUsersClient } from "./_client";

async function getUsers() {
  const result = await pool.query(`
    SELECT id, name, email, plan, comp_plan, comp_plan_expires_at, role, disabled_at, invited_at, created_at,
    (SELECT COUNT(*) FROM landing_pages WHERE user_id = users.id) as page_count
    FROM users
    ORDER BY created_at DESC, email
`);
  return result.rows;
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  const now = new Date();
  const tableRows = users.map((u) => {
    const compPlan = (u.comp_plan ?? null) as PlanId | null;
    const expiresAt: string | null = u.comp_plan_expires_at
      ? new Date(u.comp_plan_expires_at).toISOString()
      : null;
    const activeComp = activeCompPlan(compPlan, u.comp_plan_expires_at, now);
    return {
      key: u.id as string,
      id: u.id as string,
      name: (u.name ?? "") as string,
      email: u.email as string,
      plan: u.plan as PlanId,
      compPlan,
      compPlanExpiresAt: expiresAt,
      compExpired: Boolean(compPlan) && activeComp === null,
      effective: effectivePlan(u.plan as PlanId, activeComp),
      role: u.role as string,
      disabled: Boolean(u.disabled_at),
      pageCount: Number(u.page_count),
      createdAt: new Date(u.created_at).toLocaleString("zh-CN"),
    };
  });
  return <SuperAdminUsersClient rows={tableRows} />;
}
