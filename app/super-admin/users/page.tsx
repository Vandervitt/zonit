import pool from "@/lib/db";
import type { PlanId } from "@/lib/plans";
import { SuperAdminUsersClient } from "./_client";

async function getUsers() {
  const result = await pool.query(`
    SELECT id, name, email, plan, role, ls_customer_id, trial_expires_at, invited_at,
    (SELECT COUNT(*) FROM landing_pages WHERE user_id = users.id) as page_count
    FROM users
    ORDER BY invited_at DESC NULLS LAST, email
`);
  return result.rows;
}

export default async function AdminUsersPage() {
  const users = await getUsers();

  // 把需要客户端组件渲染的数据序列化传递
  const tableRows = users.map((u) => ({
    key: u.id as string,
    id: u.id as string,
    name: (u.name ?? "") as string,
    email: u.email as string,
    plan: u.plan as PlanId,
    role: u.role as string,
    pageCount: Number(u.page_count),
    invitedAt: u.invited_at ? new Date(u.invited_at).toLocaleString("zh-CN") : null,
  }));

  return <SuperAdminUsersClient rows={tableRows} />;
}
