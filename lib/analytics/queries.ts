import pool from "@/lib/db";
import {
  ATTRIBUTION_DIMENSIONS, DEFAULT_DIMENSION, UNLABELED, mergeAttribution,
  type AttributionDimension, type AttributionRow,
} from "./dimensions";

export * from "./dimensions";

export interface Totals { views: number; clicks: number; leads: number; ctr: number; cvr: number; }
export interface SeriesPoint { date: string; views: number; clicks: number; }
export interface ChannelRow { channel: string; clicks: number; }
export interface FunnelStep { key: "views" | "clicks" | "leads"; label: string; count: number; rate: number; pct: number; }
/** 表单漏斗：开始填 → 提交成功；errors 为提交被拒次数，errorBreakdown 按错误码分布。 */
export interface FormFunnel {
  starts: number;
  submits: number;
  errors: number;
  /** 开始填之后成功提交的比例——放弃率的反面，改表单控件前后就看它。 */
  completion: number;
  errorBreakdown: { detail: string; count: number }[];
}
export interface AnalyticsResult {
  totals: Totals;
  funnel: FunnelStep[];
  formFunnel: FormFunnel;
  series: SeriesPoint[];
  channels: ChannelRow[];
  /** 当前下钻维度下的归因明细（按线索数降序，其次曝光）。 */
  attribution: AttributionRow[];
  dimension: AttributionDimension;
}

export function summarize(views: number, clicks: number, leads: number): Totals {
  return {
    views, clicks, leads,
    ctr: views > 0 ? clicks / views : 0,
    cvr: views > 0 ? leads / views : 0,
  };
}

/** 三步转化漏斗：曝光→CTA 点击→线索。rate 相对上一步转化率，pct 相对曝光的占比（用于条形宽度）。 */
export function buildFunnel(views: number, clicks: number, leads: number): FunnelStep[] {
  const rate = (cur: number, prev: number) => (prev > 0 ? cur / prev : 0);
  const pct = (cur: number) => (views > 0 ? cur / views : 0);
  return [
    { key: "views", label: "曝光", count: views, rate: 1, pct: 1 },
    { key: "clicks", label: "CTA 点击", count: clicks, rate: rate(clicks, views), pct: pct(clicks) },
    { key: "leads", label: "线索", count: leads, rate: rate(leads, clicks), pct: pct(leads) },
  ];
}

export function buildFormFunnel(
  starts: number,
  submits: number,
  errorRows: { detail: string; count: number }[],
): FormFunnel {
  const errors = errorRows.reduce((n, r) => n + r.count, 0);
  return {
    starts,
    submits,
    errors,
    completion: starts > 0 ? submits / starts : 0,
    errorBreakdown: errorRows,
  };
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

export async function getAnalytics(
  userId: string,
  pageId: string,
  days: number,
  dimension: AttributionDimension = DEFAULT_DIMENSION,
): Promise<AnalyticsResult> {
  const dimCol = ATTRIBUTION_DIMENSIONS[dimension];
  const scope =
    pageId === "all"
      ? { sql: `SELECT id FROM landing_pages WHERE user_id = $1`, params: [userId] as unknown[] }
      : { sql: `SELECT id FROM landing_pages WHERE user_id = $1 AND id = $2`, params: [userId, pageId] };
  const idsRes = await pool.query(scope.sql, scope.params);
  const ids = idsRes.rows.map((r) => r.id as string);
  if (ids.length === 0) {
    return {
      totals: summarize(0, 0, 0), funnel: buildFunnel(0, 0, 0), formFunnel: buildFormFunnel(0, 0, []),
      series: buildSeries([], lastNDates(days)), channels: [], attribution: [], dimension,
    };
  }
  const since = `now() - ($2 || ' days')::interval`;
  const base = `FROM analytics_events WHERE page_id = ANY($1) AND created_at >= ${since}`;

  const [totalsRes, seriesRes, channelsRes, attrEventsRes, attrLeadsRes, leadsRes, formErrorsRes] = await Promise.all([
    pool.query(`SELECT
        count(*) FILTER (WHERE event='page_view')::int   AS views,
        count(*) FILTER (WHERE event='cta_click')::int   AS clicks,
        count(*) FILTER (WHERE event='form_start')::int  AS form_starts,
        count(*) FILTER (WHERE event='form_submit')::int AS form_submits
       ${base}`, [ids, days]),
    pool.query(`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base} GROUP BY 1 ORDER BY 1`, [ids, days]),
    pool.query(`SELECT COALESCE(channel,'external') AS channel, count(*)::int AS clicks
       ${base} AND event='cta_click' GROUP BY 1 ORDER BY clicks DESC`, [ids, days]),
    // 归因下钻（曝光/点击侧）。dimCol 来自 ATTRIBUTION_DIMENSIONS 白名单，非用户输入。
    pool.query(`SELECT COALESCE(${dimCol},$3) AS value,
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base} AND event IN ('page_view','cta_click') GROUP BY 1`, [ids, days, UNLABELED]),
    // 归因下钻（线索侧）：leads 表独立统计，与曝光侧在 mergeAttribution 里合并。
    pool.query(`SELECT COALESCE(${dimCol},$3) AS value, count(*)::int AS leads
       FROM leads WHERE page_id = ANY($1) AND created_at >= ${since} GROUP BY 1`, [ids, days, UNLABELED]),
    // 线索来自独立的 leads 表（含 PII），与无 PII 的 analytics_events 分开统计。
    pool.query(`SELECT count(*)::int AS leads
       FROM leads WHERE page_id = ANY($1) AND created_at >= ${since}`, [ids, days]),
    pool.query(`SELECT COALESCE(detail,'unknown') AS detail, count(*)::int AS count
       ${base} AND event='form_error' GROUP BY 1 ORDER BY count DESC`, [ids, days]),
  ]);

  const v = Number(totalsRes.rows[0]?.views ?? 0);
  const c = Number(totalsRes.rows[0]?.clicks ?? 0);
  const l = Number(leadsRes.rows[0]?.leads ?? 0);
  return {
    totals: summarize(v, c, l),
    funnel: buildFunnel(v, c, l),
    formFunnel: buildFormFunnel(
      Number(totalsRes.rows[0]?.form_starts ?? 0),
      Number(totalsRes.rows[0]?.form_submits ?? 0),
      formErrorsRes.rows.map((r) => ({ detail: r.detail as string, count: Number(r.count) })),
    ),
    series: buildSeries(
      seriesRes.rows.map((r) => ({ date: r.date as string, views: Number(r.views), clicks: Number(r.clicks) })),
      lastNDates(days),
    ),
    channels: channelsRes.rows.map((r) => ({ channel: r.channel as string, clicks: Number(r.clicks) })),
    attribution: mergeAttribution(
      attrEventsRes.rows.map((r) => ({ value: r.value as string, views: Number(r.views), clicks: Number(r.clicks) })),
      attrLeadsRes.rows.map((r) => ({ value: r.value as string, leads: Number(r.leads) })),
    ),
    dimension,
  };
}
