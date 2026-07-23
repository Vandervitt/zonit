// 周报摘要：聚合每位租户近 7 天各已发布页的曝光 / CTA 点击 / 线索数（含上一周环比），
// 由每日 cron 编排器在周一触发发送。无已发布页或两周全零的用户跳过（不打扰）。
import pool from "@/lib/db";

export interface DigestPageStats {
  pageId: string;
  name: string;
  views: number;
  ctaClicks: number;
  leads: number;
  prevViews: number;
  prevCtaClicks: number;
  prevLeads: number;
}

export interface UserDigest {
  userId: string;
  email: string;
  pages: DigestPageStats[];
}

/** 全零判断：本周与上周所有指标皆为 0。 */
function allZero(p: DigestPageStats): boolean {
  return p.views + p.ctaClicks + p.leads + p.prevViews + p.prevCtaClicks + p.prevLeads === 0;
}

/**
 * 计算应发送周报的用户与数据。窗口：[now-7d, now) 为本周，[now-14d, now-7d) 为上周。
 * 过滤：未禁用账号、周报开关未关（无设置行视为开）、至少一张已发布页且指标非全零。
 */
export async function computeWeeklyDigests(now: Date): Promise<UserDigest[]> {
  const since = new Date(now.getTime() - 7 * 86_400_000);
  const prevSince = new Date(now.getTime() - 14 * 86_400_000);

  const [pagesRes, leadsRes] = await Promise.all([
    pool.query(
      `SELECT p.user_id, p.id AS page_id, p.name, u.email,
              COUNT(*) FILTER (WHERE a.event = 'page_view' AND a.created_at >= $1)::int  AS views,
              COUNT(*) FILTER (WHERE a.event = 'cta_click' AND a.created_at >= $1)::int  AS cta_clicks,
              COUNT(*) FILTER (WHERE a.event = 'page_view' AND a.created_at <  $1)::int  AS prev_views,
              COUNT(*) FILTER (WHERE a.event = 'cta_click' AND a.created_at <  $1)::int  AS prev_cta_clicks
         FROM landing_pages p
         JOIN users u ON u.id = p.user_id
         LEFT JOIN lead_notification_settings s ON s.user_id = p.user_id
         LEFT JOIN analytics_events a ON a.page_id = p.id AND a.created_at >= $2 AND a.created_at < $3
        WHERE p.status = 'published'
          AND u.disabled_at IS NULL
          AND u.email IS NOT NULL
          AND COALESCE(s.weekly_digest_enabled, TRUE)
        GROUP BY p.user_id, p.id, p.name, u.email`,
      [since, prevSince, now],
    ),
    pool.query(
      `SELECT l.page_id,
              COUNT(*) FILTER (WHERE l.created_at >= $1)::int AS leads,
              COUNT(*) FILTER (WHERE l.created_at <  $1)::int AS prev_leads
         FROM leads l
        WHERE l.created_at >= $2 AND l.created_at < $3
        GROUP BY l.page_id`,
      [since, prevSince, now],
    ),
  ]);

  const leadsByPage = new Map<string, { leads: number; prev_leads: number }>(
    leadsRes.rows.map((r) => [r.page_id as string, { leads: r.leads, prev_leads: r.prev_leads }]),
  );

  const byUser = new Map<string, UserDigest>();
  for (const r of pagesRes.rows) {
    const lead = leadsByPage.get(r.page_id) ?? { leads: 0, prev_leads: 0 };
    const stats: DigestPageStats = {
      pageId: r.page_id,
      name: r.name,
      views: r.views,
      ctaClicks: r.cta_clicks,
      leads: lead.leads,
      prevViews: r.prev_views,
      prevCtaClicks: r.prev_cta_clicks,
      prevLeads: lead.prev_leads,
    };
    let d = byUser.get(r.user_id);
    if (!d) {
      d = { userId: r.user_id, email: r.email, pages: [] };
      byUser.set(r.user_id, d);
    }
    d.pages.push(stats);
  }

  return [...byUser.values()].filter((d) => !d.pages.every(allZero));
}

/** 环比文案：上周 0 时不给百分比（避免除零/无意义暴涨）。 */
export function trendText(current: number, prev: number): string {
  if (prev === 0) return current > 0 ? "新增" : "—";
  const pct = Math.round(((current - prev) / prev) * 100);
  if (pct === 0) return "持平";
  return pct > 0 ? `↑${pct}%` : `↓${Math.abs(pct)}%`;
}
