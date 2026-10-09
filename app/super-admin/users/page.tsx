import pool from "@/lib/db";
import { effectivePlan, activeCompPlan, type PlanId } from "@/lib/plans";
import { UserRole } from "@/lib/constants";
import { MILESTONE_EVENTS, type MilestoneEvent } from "@/lib/platform-milestones";
import { PAID_USER } from "@/lib/super-admin/metrics";
import { OPS_VIEWS, type OpsView } from "@/lib/super-admin/user-ops";
import { SuperAdminUsersClient } from "./_client";

const iso = (v: unknown) => (v ? new Date(v as string).toISOString() : null);

// 一次聚合取齐运营视图所需事实；各聚合先按 user_id 归并再 JOIN，避免逐行子查询与 JOIN 扇出。
async function getUsers() {
  const result = await pool.query(`
    SELECT u.id, u.name, u.email, u.plan, u.comp_plan, u.comp_plan_expires_at, u.role, u.disabled_at,
           u.is_internal, u.created_at, u.last_seen_at, ${PAID_USER} AS paid,
           COALESCE(pc.n, 0)::int AS page_count,
           COALESCE(ms.events, '{}') AS milestones, ms.published_at,
           ll.last_lead_at,
           nt.body AS note_body, nt.created_at AS note_at
      FROM users u
      LEFT JOIN (SELECT user_id, COUNT(*) AS n FROM landing_pages GROUP BY user_id) pc ON pc.user_id = u.id
      LEFT JOIN (
        SELECT user_id, array_agg(event) AS events,
               MIN(created_at) FILTER (WHERE event = 'page_published') AS published_at
          FROM platform_milestones GROUP BY user_id
      ) ms ON ms.user_id = u.id
      LEFT JOIN (
        SELECT lp.user_id, MAX(l.created_at) AS last_lead_at
          FROM leads l JOIN landing_pages lp ON lp.id = l.page_id GROUP BY lp.user_id
      ) ll ON ll.user_id = u.id
      LEFT JOIN LATERAL (
        SELECT body, created_at FROM user_admin_notes n WHERE n.user_id = u.id ORDER BY created_at DESC LIMIT 1
      ) nt ON true
     ORDER BY u.created_at DESC, u.email`);
  return result.rows;
}

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string | string[] }>;
}) {
  const rawView = (await searchParams).view;
  const initialView: OpsView = (OPS_VIEWS as readonly unknown[]).includes(rawView) ? (rawView as OpsView) : "all";
  const users = await getUsers();
  const now = new Date();
  const tableRows = users.map((u) => {
    const compPlan = (u.comp_plan ?? null) as PlanId | null;
    const activeComp = activeCompPlan(compPlan, u.comp_plan_expires_at, now);
    return {
      key: u.id as string,
      id: u.id as string,
      name: (u.name ?? "") as string,
      email: u.email as string,
      plan: u.plan as PlanId,
      compPlan,
      compPlanExpiresAt: iso(u.comp_plan_expires_at),
      compExpired: Boolean(compPlan) && activeComp === null,
      effective: effectivePlan(u.plan as PlanId, activeComp),
      role: u.role as string,
      disabled: Boolean(u.disabled_at),
      internal: Boolean(u.is_internal) || u.role === UserRole.SUPER_ADMIN,
      internalLocked: u.role === UserRole.SUPER_ADMIN,
      pageCount: Number(u.page_count),
      createdAt: iso(u.created_at)!,
      lastSeenAt: iso(u.last_seen_at),
      milestones: (u.milestones as string[]).filter((e): e is MilestoneEvent =>
        (MILESTONE_EVENTS as readonly string[]).includes(e)),
      publishedAt: iso(u.published_at),
      lastLeadAt: iso(u.last_lead_at),
      paid: Boolean(u.paid),
      latestNote: u.note_body ? { body: u.note_body as string, at: iso(u.note_at)! } : null,
    };
  });
  return <SuperAdminUsersClient rows={tableRows} nowIso={now.toISOString()} initialView={initialView} />;
}
