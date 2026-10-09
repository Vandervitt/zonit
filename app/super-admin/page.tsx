import pool from "@/lib/db";
import { effectivePlan, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { fillDailySeries, type DailyPoint } from "@/lib/super-admin/trend";
import { getFunnelStats } from "@/lib/platform-milestones";
import {
  EXTERNAL_USER, PAID_USER, parseStatsRange, ratePercent, type StatsRange,
} from "@/lib/super-admin/metrics";
import { aiJobHealth, cronHealth } from "@/lib/super-admin/ops-health";
import { SuperAdminOverview, type OverviewStats } from "./_overview-client";
import type { OpsHealthData } from "./OpsHealth";

const AI_STUCK_SQL = `(j.status = 'pending' AND j.created_at < NOW() - INTERVAL '10 minutes')`;

// 运行健康不排除内部账号：这里看的是系统有没有坏，谁触发的都算。
async function getOpsHealth(now: Date): Promise<OpsHealthData> {
  const [cronRes, aiRes, reasonsRes, failuresRes] = await Promise.all([
    pool.query(`SELECT started_at, failed_tasks FROM cron_runs WHERE job = 'daily' ORDER BY started_at DESC LIMIT 7`),
    pool.query(`SELECT status, created_at FROM landing_page_ai_jobs WHERE created_at > NOW() - INTERVAL '7 days'`),
    pool.query(`
      SELECT COALESCE(j.reason, CASE WHEN ${AI_STUCK_SQL} THEN 'stuck' ELSE 'unknown' END) AS reason, COUNT(*)::int AS n
        FROM landing_page_ai_jobs j
       WHERE j.created_at > NOW() - INTERVAL '7 days' AND (j.status = 'failed' OR ${AI_STUCK_SQL})
       GROUP BY 1 ORDER BY n DESC LIMIT 5`),
    pool.query(`
      SELECT j.id, u.email, j.status, j.reason, j.created_at
        FROM landing_page_ai_jobs j LEFT JOIN users u ON u.id = j.user_id
       WHERE j.created_at > NOW() - INTERVAL '7 days' AND (j.status = 'failed' OR ${AI_STUCK_SQL})
       ORDER BY j.created_at DESC LIMIT 5`),
  ]);
  const cronRuns = cronRes.rows.map((r) => ({
    ranAt: new Date(r.started_at).toISOString(),
    failedTasks: r.failed_tasks as string[],
  }));
  return {
    cronStatus: cronHealth(cronRuns[0] ?? null, now).status,
    cronRuns,
    ai: aiJobHealth(aiRes.rows.map((r) => ({ status: r.status, createdAt: new Date(r.created_at).toISOString() })), now),
    aiTopReasons: reasonsRes.rows,
    aiRecentFailures: failuresRes.rows.map((r) => ({
      id: r.id, email: r.email, status: r.status, reason: r.reason,
      createdAt: new Date(r.created_at).toISOString(),
    })),
  };
}

// 全部统计排除内部账号（超管、测试号），口径见 lib/super-admin/metrics.ts。
async function getStats(range: StatsRange): Promise<OverviewStats> {
  const now = new Date();
  const [userAgg, pagesCount, leadsCount, planRows, userTrend, leadTrend, latestPages, funnel, opsHealth] =
    await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE ${PAID_USER})::int AS paid,
               COUNT(*) FILTER (WHERE u.comp_plan IS NOT NULL
                                  AND (u.comp_plan_expires_at IS NULL OR u.comp_plan_expires_at > NOW())
                                  AND NOT ${PAID_USER})::int AS comp,
               (SELECT COUNT(*)::int FROM users WHERE is_internal OR role = 'SUPER_ADMIN') AS internal
          FROM users u WHERE ${EXTERNAL_USER}`),
      pool.query(`SELECT COUNT(*)::int AS n FROM landing_pages lp JOIN users u ON u.id = lp.user_id WHERE ${EXTERNAL_USER}`),
      pool.query(`
        SELECT COUNT(*)::int AS n FROM leads l
          JOIN landing_pages lp ON lp.id = l.page_id
          JOIN users u ON u.id = lp.user_id
         WHERE ${EXTERNAL_USER}`),
      pool.query(`SELECT u.plan, u.comp_plan FROM users u WHERE ${EXTERNAL_USER}`),
      pool.query(`
        SELECT to_char(date_trunc('day', u.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
          FROM users u WHERE u.created_at > NOW() - INTERVAL '30 days' AND ${EXTERNAL_USER} GROUP BY 1`),
      pool.query(`
        SELECT to_char(date_trunc('day', l.created_at AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS day, COUNT(*)::int AS count
          FROM leads l
          JOIN landing_pages lp ON lp.id = l.page_id
          JOIN users u ON u.id = lp.user_id
         WHERE l.created_at > NOW() - INTERVAL '30 days' AND ${EXTERNAL_USER} GROUP BY 1`),
      pool.query(`
        SELECT lp.id, lp.name, lp.status, lp.created_at, u.email AS user_email
          FROM landing_pages lp JOIN users u ON lp.user_id = u.id
         WHERE ${EXTERNAL_USER}
         ORDER BY lp.created_at DESC LIMIT 5`),
      getFunnelStats(range),
      getOpsHealth(now),
    ]);

  const planDist = Object.fromEntries(PLAN_ORDER.map((p) => [p, 0])) as Record<PlanId, number>;
  for (const r of planRows.rows) {
    planDist[effectivePlan((r.plan ?? "free") as PlanId, r.comp_plan as PlanId | null)]++;
  }

  const { total, paid, comp, internal } = userAgg.rows[0];
  return {
    range,
    totalUsers: total,
    internalUsers: internal,
    totalPages: pagesCount.rows[0].n,
    paidUsers: paid,
    compUsers: comp,
    paidRate: ratePercent(paid, total, 1),
    totalLeads: leadsCount.rows[0].n,
    planDist,
    userTrend: fillDailySeries(userTrend.rows as DailyPoint[], 30, now),
    leadTrend: fillDailySeries(leadTrend.rows as DailyPoint[], 30, now),
    latestPages: latestPages.rows.map((r) => ({
      id: r.id, name: r.name, status: r.status,
      created_at: new Date(r.created_at).toISOString(), user_email: r.user_email,
    })),
    funnel,
    opsHealth,
  };
}

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ range?: string | string[] }>;
}) {
  const range = parseStatsRange((await searchParams).range);
  const stats = await getStats(range);
  return <SuperAdminOverview stats={stats} />;
}
