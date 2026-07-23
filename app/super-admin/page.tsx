import pool from "@/lib/db";
import { effectivePlan, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { fillDailySeries, type DailyPoint } from "@/lib/super-admin/trend";
import { getFunnelStats } from "@/lib/platform-milestones";
import { SuperAdminOverview, type OverviewStats } from "./_overview-client";

async function getStats(): Promise<OverviewStats> {
  const [usersCount, pagesCount, activeSubscriptions, leadsCount, planRows, userTrend, leadTrend, latestPages, funnel] =
    await Promise.all([
      pool.query("SELECT COUNT(*) FROM users"),
      pool.query("SELECT COUNT(*) FROM landing_pages"),
      pool.query("SELECT COUNT(*) FROM users WHERE plan != 'free'"),
      pool.query("SELECT COUNT(*) FROM leads"),
      pool.query("SELECT plan, comp_plan FROM users"),
      pool.query(`
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM users WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY 1`),
      pool.query(`
        SELECT to_char(date_trunc('day', created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
        FROM leads WHERE created_at > NOW() - INTERVAL '30 days' GROUP BY 1`),
      pool.query(`
        SELECT lp.id, lp.name, lp.status, lp.created_at, u.email as user_email
        FROM landing_pages lp JOIN users u ON lp.user_id = u.id
        ORDER BY lp.created_at DESC LIMIT 5`),
      getFunnelStats(),
    ]);

  const planDist = Object.fromEntries(PLAN_ORDER.map((p) => [p, 0])) as Record<PlanId, number>;
  for (const r of planRows.rows) {
    planDist[effectivePlan((r.plan ?? "free") as PlanId, r.comp_plan as PlanId | null)]++;
  }

  const now = new Date();
  return {
    totalUsers: parseInt(usersCount.rows[0].count),
    totalPages: parseInt(pagesCount.rows[0].count),
    activeSubs: parseInt(activeSubscriptions.rows[0].count),
    totalLeads: parseInt(leadsCount.rows[0].count),
    planDist,
    userTrend: fillDailySeries(userTrend.rows as DailyPoint[], 30, now),
    leadTrend: fillDailySeries(leadTrend.rows as DailyPoint[], 30, now),
    latestPages: latestPages.rows.map((r) => ({
      id: r.id, name: r.name, status: r.status,
      created_at: new Date(r.created_at).toISOString(), user_email: r.user_email,
    })),
    funnel,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();
  return <SuperAdminOverview stats={stats} />;
}
