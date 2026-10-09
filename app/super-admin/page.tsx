import pool from "@/lib/db";
import { effectivePlan, PLAN_ORDER, type PlanId } from "@/lib/plans";
import { fillDailySeries, type DailyPoint } from "@/lib/super-admin/trend";
import { getFunnelStats } from "@/lib/platform-milestones";
import {
  EXTERNAL_USER, PAID_USER, parseStatsRange, ratePercent, weekOverWeek, type StatsRange,
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
  const [userAgg, kpiRes, leadsCount, planRows, userTrend, leadTrend, funnel, opsHealth] =
    await Promise.all([
      pool.query(`
        SELECT COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE ${PAID_USER})::int AS paid,
               COUNT(*) FILTER (WHERE u.comp_plan IS NOT NULL
                                  AND (u.comp_plan_expires_at IS NULL OR u.comp_plan_expires_at > NOW())
                                  AND NOT ${PAID_USER})::int AS comp,
               (SELECT COUNT(*)::int FROM users WHERE is_internal OR role = 'SUPER_ADMIN') AS internal
          FROM users u WHERE ${EXTERNAL_USER}`),
      // 周对比指标。激活 = 注册后 7 天内首次发布；只有注册满 7 天的人才有结论，
      // 所以「本周激活率」看的是 7–14 天前注册的那批，上周看 14–21 天前那批。
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE u.created_at > NOW() - INTERVAL '7 days')::int AS new_this,
          COUNT(*) FILTER (WHERE u.created_at <= NOW() - INTERVAL '7 days' AND u.created_at > NOW() - INTERVAL '14 days')::int AS new_prev,
          COUNT(*) FILTER (WHERE u.created_at <= NOW() - INTERVAL '7 days' AND u.created_at > NOW() - INTERVAL '14 days')::int AS act_base_this,
          COUNT(*) FILTER (WHERE u.created_at <= NOW() - INTERVAL '7 days' AND u.created_at > NOW() - INTERVAL '14 days'
                             AND pub.created_at <= u.created_at + INTERVAL '7 days')::int AS act_hit_this,
          COUNT(*) FILTER (WHERE u.created_at <= NOW() - INTERVAL '14 days' AND u.created_at > NOW() - INTERVAL '21 days')::int AS act_base_prev,
          COUNT(*) FILTER (WHERE u.created_at <= NOW() - INTERVAL '14 days' AND u.created_at > NOW() - INTERVAL '21 days'
                             AND pub.created_at <= u.created_at + INTERVAL '7 days')::int AS act_hit_prev,
          COUNT(*) FILTER (WHERE u.last_seen_at > NOW() - INTERVAL '7 days')::int AS wau,
          COUNT(pub.user_id)::int AS published,
          COUNT(fl.user_id)::int AS with_lead
          FROM users u
          LEFT JOIN platform_milestones pub ON pub.user_id = u.id AND pub.event = 'page_published'
          LEFT JOIN platform_milestones fl ON fl.user_id = u.id AND fl.event = 'first_lead'
         WHERE ${EXTERNAL_USER}`),
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
      getFunnelStats(range),
      getOpsHealth(now),
    ]);

  const planDist = Object.fromEntries(PLAN_ORDER.map((p) => [p, 0])) as Record<PlanId, number>;
  for (const r of planRows.rows) {
    planDist[effectivePlan((r.plan ?? "free") as PlanId, r.comp_plan as PlanId | null)]++;
  }

  const { total, paid, comp, internal } = userAgg.rows[0];
  const k = kpiRes.rows[0];
  const actThis = ratePercent(k.act_hit_this, k.act_base_this, 0);
  const actPrev = ratePercent(k.act_hit_prev, k.act_base_prev, 0);
  return {
    range,
    totalUsers: total,
    internalUsers: internal,
    kpi: {
      newThis: k.new_this,
      newWow: weekOverWeek(k.new_this, k.new_prev),
      activationThis: actThis,
      activationBase: k.act_base_this,
      activationDelta: actThis != null && actPrev != null ? actThis - actPrev : null,
      wau: k.wau,
      firstLeadRate: ratePercent(k.with_lead, k.published, 0),
      published: k.published,
      withLead: k.with_lead,
    },
    paidUsers: paid,
    compUsers: comp,
    paidRate: ratePercent(paid, total, 1),
    totalLeads: leadsCount.rows[0].n,
    planDist,
    userTrend: fillDailySeries(userTrend.rows as DailyPoint[], 30, now),
    leadTrend: fillDailySeries(leadTrend.rows as DailyPoint[], 30, now),
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
