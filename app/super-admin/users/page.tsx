import pool from "@/lib/db";
import { effectivePlan, type PlanId } from "@/lib/plans";
import { SuperAdminUsersClient } from "./_client";

async function getUsers() {
  const result = await pool.query(`
    SELECT id, name, email, plan, comp_plan, role, disabled_at, invited_at, created_at,
    (SELECT COUNT(*) FROM landing_pages WHERE user_id = users.id) as page_count
    FROM users
    ORDER BY created_at DESC, email
`);
  return result.rows;
}

export default async function AdminUsersPage() {
  const users = await getUsers();
  const tableRows = users.map((u) => ({
    key: u.id as string,
    id: u.id as string,
    name: (u.name ?? "") as string,
    email: u.email as string,
    plan: u.plan as PlanId,
    compPlan: (u.comp_plan ?? null) as PlanId | null,
    effective: effectivePlan(u.plan as PlanId, u.comp_plan as PlanId | null),
    role: u.role as string,
    disabled: Boolean(u.disabled_at),
    pageCount: Number(u.page_count),
    createdAt: new Date(u.created_at).toLocaleString("zh-CN"),
  }));
  return <SuperAdminUsersClient rows={tableRows} />;
}
