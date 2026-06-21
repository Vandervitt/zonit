import pool from "@/lib/db";

export interface Totals { views: number; clicks: number; ctr: number; }
export interface SeriesPoint { date: string; views: number; clicks: number; }
export interface ChannelRow { channel: string; clicks: number; }
export interface SourceRow { utm_source: string; views: number; }
export interface AnalyticsResult {
  totals: Totals;
  series: SeriesPoint[];
  channels: ChannelRow[];
  sources: SourceRow[];
}

export function summarize(views: number, clicks: number): Totals {
  return { views, clicks, ctr: views > 0 ? clicks / views : 0 };
}

export function buildSeries(
  rows: { date: string; views: number; clicks: number }[],
  dates: string[],
): SeriesPoint[] {
  const map = new Map(rows.map((r) => [r.date, r]));
  return dates.map((d) => map.get(d) ?? { date: d, views: 0, clicks: 0 });
}

export function lastNDates(days: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - i));
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

export async function getAnalytics(userId: string, pageId: string, days: number): Promise<AnalyticsResult> {
  const scope =
    pageId === "all"
      ? { sql: `SELECT id FROM landing_pages WHERE user_id = $1`, params: [userId] as unknown[] }
      : { sql: `SELECT id FROM landing_pages WHERE user_id = $1 AND id = $2`, params: [userId, pageId] };
  const idsRes = await pool.query(scope.sql, scope.params);
  const ids = idsRes.rows.map((r) => r.id as string);
  if (ids.length === 0) {
    return { totals: summarize(0, 0), series: buildSeries([], lastNDates(days)), channels: [], sources: [] };
  }
  const since = `now() - ($2 || ' days')::interval`;
  const base = `FROM analytics_events WHERE page_id = ANY($1) AND created_at >= ${since}`;

  const [totalsRes, seriesRes, channelsRes, sourcesRes] = await Promise.all([
    pool.query(`SELECT
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base}`, [ids, days]),
    pool.query(`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base} GROUP BY 1 ORDER BY 1`, [ids, days]),
    pool.query(`SELECT COALESCE(channel,'external') AS channel, count(*)::int AS clicks
       ${base} AND event='cta_click' GROUP BY 1 ORDER BY clicks DESC`, [ids, days]),
    pool.query(`SELECT COALESCE(utm_source,'(直接/未知)') AS utm_source, count(*)::int AS views
       ${base} AND event='page_view' GROUP BY 1 ORDER BY views DESC LIMIT 20`, [ids, days]),
  ]);

  const v = Number(totalsRes.rows[0]?.views ?? 0);
  const c = Number(totalsRes.rows[0]?.clicks ?? 0);
  return {
    totals: summarize(v, c),
    series: buildSeries(
      seriesRes.rows.map((r) => ({ date: r.date as string, views: Number(r.views), clicks: Number(r.clicks) })),
      lastNDates(days),
    ),
    channels: channelsRes.rows.map((r) => ({ channel: r.channel as string, clicks: Number(r.clicks) })),
    sources: sourcesRes.rows.map((r) => ({ utm_source: r.utm_source as string, views: Number(r.views) })),
  };
}
