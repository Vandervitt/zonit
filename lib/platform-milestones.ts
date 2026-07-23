// 平台激活漏斗里程碑：记录用户首次达成的关键节点（注册 → 建页 → 域名验证 → 发布 → 首线索）。
// 写入全部 best-effort：埋点失败只记日志，绝不影响注册/发布/留资等主链路。
import pool from "@/lib/db";

export const MILESTONE_EVENTS = [
  "signup",
  "page_created",
  "domain_verified",
  "page_published",
  "first_lead",
] as const;
export type MilestoneEvent = (typeof MILESTONE_EVENTS)[number];

/** 记录里程碑（首次达成语义，重复调用幂等，永不抛错）。 */
export async function recordMilestone(userId: string, event: MilestoneEvent): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO platform_milestones (user_id, event) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [userId, event],
    );
  } catch (err) {
    console.error(`milestone ${event} failed:`, err);
  }
}

/** 公开留资场景无登录态，按 page 反查页主人记 first_lead（坏 pageId 静默无操作）。 */
export async function recordFirstLeadMilestone(pageId: string): Promise<void> {
  try {
    await pool.query(
      `INSERT INTO platform_milestones (user_id, event)
         SELECT user_id, 'first_lead' FROM landing_pages WHERE id = $1
       ON CONFLICT DO NOTHING`,
      [pageId],
    );
  } catch (err) {
    console.error("milestone first_lead failed:", err);
  }
}

export interface FunnelStats {
  /** 各里程碑达成人数。 */
  counts: Record<MilestoneEvent, number>;
  /** 注册 → 首次发布耗时中位数（小时）；无达成用户为 null。 */
  medianHoursToPublish: number | null;
}

/** super-admin 看板：激活漏斗聚合。 */
export async function getFunnelStats(): Promise<FunnelStats> {
  const [countsRes, medianRes] = await Promise.all([
    pool.query(`SELECT event, COUNT(*)::int AS n FROM platform_milestones GROUP BY event`),
    pool.query(`
      SELECT percentile_cont(0.5) WITHIN GROUP (
               ORDER BY EXTRACT(EPOCH FROM (p.created_at - s.created_at)) / 3600
             ) AS h
        FROM platform_milestones s
        JOIN platform_milestones p ON p.user_id = s.user_id AND p.event = 'page_published'
       WHERE s.event = 'signup' AND p.created_at >= s.created_at`),
  ]);
  const counts = Object.fromEntries(MILESTONE_EVENTS.map((e) => [e, 0])) as Record<MilestoneEvent, number>;
  for (const r of countsRes.rows) {
    if ((MILESTONE_EVENTS as readonly string[]).includes(r.event)) counts[r.event as MilestoneEvent] = r.n;
  }
  const h = medianRes.rows[0]?.h;
  return { counts, medianHoursToPublish: h == null ? null : Number(h) };
}
