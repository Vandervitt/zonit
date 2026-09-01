import pool from "@/lib/db";
import {
  ATTRIBUTION_DIMENSIONS, DEFAULT_DIMENSION, UNLABELED, mergeAttribution,
  type AttributionDimension, type AttributionRow,
} from "./dimensions";

import { previousRange, changeRate, datesInRange, type DateRange } from "./range";

export * from "./dimensions";
export * from "./range";

export interface Totals {
  views: number;
  clicks: number;
  leads: number;
  ctr: number;
  cvr: number;
  /**
   * 按天去重的访客数。**迁移 050 之前的时段为 null**——那些行没有
   * visitor_hash，且无法补算（原始 IP/UA 从未落库）。
   * null 必须在界面上呈现为「该时段无此数据」，不得补 0，也不得回退成 views：
   * 前者是撒谎，后者会把口径变化读成流量暴跌。
   */
  uniqueViews: number | null;
}
export interface SeriesPoint { date: string; views: number; clicks: number; }
export interface ChannelRow { channel: string; clicks: number; }
// 只回 key 不回 label：展示文案随后台界面语言变化，归 lib/i18n/admin 的 analytics.funnel.steps 管。
export interface FunnelStep { key: "views" | "clicks" | "leads"; count: number; rate: number; pct: number; }
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
  /** 紧邻等长上一段的核心指标 + 环比变化率（上一段为 0 时为 null）。 */
  comparison: Comparison;
  range: DateRange;
}

export interface Comparison {
  previous: { views: number; clicks: number; leads: number };
  /** 变化率；上一段为 0 的指标为 null——「从 0 到 5」不是「增长 100%」。 */
  change: { views: number | null; clicks: number | null; leads: number | null };
}

/** 一张落地页在区间内的表现（多页横向对比用）。 */
export interface PagePerformanceRow {
  pageId: string;
  name: string;
  views: number;
  clicks: number;
  leads: number;
  cvr: number;
}

/**
 * 名下所有落地页的横向对比。
 *
 * 为什么单独一条查询而不是复用 getAnalytics：后者的入参是「一张页或全部」，
 * 回答不了「这十张页里哪张在跑、哪张在空转」——而这正是同时管多个客户时
 * 每天都要看的第一眼。
 */
export async function getPagePerformance(userId: string, range: DateRange): Promise<PagePerformanceRow[]> {
  const window = `created_at >= $2 AND created_at < $3`;
  const res = await pool.query(
    `SELECT lp.id AS page_id, lp.name,
            COALESCE(e.views, 0)::int  AS views,
            COALESCE(e.clicks, 0)::int AS clicks,
            COALESCE(l.leads, 0)::int  AS leads
       FROM landing_pages lp
       LEFT JOIN LATERAL (
         SELECT count(*) FILTER (WHERE event='page_view') AS views,
                count(*) FILTER (WHERE event='cta_click') AS clicks
           FROM analytics_events
          WHERE page_id = lp.id AND ${window}
       ) e ON true
       LEFT JOIN LATERAL (
         SELECT count(*) AS leads FROM leads
          WHERE page_id = lp.id AND ${window}
       ) l ON true
      WHERE lp.user_id = $1`,
    [userId, range.from, range.to],
  );
  return res.rows
    .map((r) => {
      const views = Number(r.views);
      const leads = Number(r.leads);
      return {
        pageId: r.page_id as string,
        name: r.name as string,
        views, clicks: Number(r.clicks), leads,
        cvr: views > 0 ? leads / views : 0,
      };
    })
    // 有线索的排前面，其次按曝光——空转的页沉底，正是要一眼看出来的那批。
    .sort((a, b) => b.leads - a.leads || b.views - a.views);
}

/**
 * @param uniqueViews 按天去重的访客数；**该时段没有采集过 visitor_hash 时必须传
 *   null**（不是 0）。判据是「这段区间里有没有任何一条带 visitor_hash 的 page_view」，
 *   由调用方给出——查询层比展示层更清楚数据到底存不存在。
 */
export function summarize(
  views: number,
  clicks: number,
  leads: number,
  uniqueViews: number | null = null,
): Totals {
  return {
    views, clicks, leads,
    ctr: views > 0 ? clicks / views : 0,
    cvr: views > 0 ? leads / views : 0,
    uniqueViews,
  };
}

/** 三步转化漏斗：曝光→CTA 点击→线索。rate 相对上一步转化率，pct 相对曝光的占比（用于条形宽度）。 */
export function buildFunnel(views: number, clicks: number, leads: number): FunnelStep[] {
  const rate = (cur: number, prev: number) => (prev > 0 ? cur / prev : 0);
  const pct = (cur: number) => (views > 0 ? cur / views : 0);
  return [
    { key: "views", count: views, rate: 1, pct: 1 },
    { key: "clicks", count: clicks, rate: rate(clicks, views), pct: pct(clicks) },
    { key: "leads", count: leads, rate: rate(leads, clicks), pct: pct(leads) },
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

export async function getAnalytics(
  userId: string,
  pageId: string,
  range: DateRange,
  dimension: AttributionDimension = DEFAULT_DIMENSION,
): Promise<AnalyticsResult> {
  const dimCol = ATTRIBUTION_DIMENSIONS[dimension];
  const prev = previousRange(range);
  const scope =
    pageId === "all"
      ? { sql: `SELECT id FROM landing_pages WHERE user_id = $1`, params: [userId] as unknown[] }
      : { sql: `SELECT id FROM landing_pages WHERE user_id = $1 AND id = $2`, params: [userId, pageId] };
  const idsRes = await pool.query(scope.sql, scope.params);
  const ids = idsRes.rows.map((r) => r.id as string);
  if (ids.length === 0) {
    return {
      totals: summarize(0, 0, 0), funnel: buildFunnel(0, 0, 0), formFunnel: buildFormFunnel(0, 0, []),
      series: buildSeries([], datesInRange(range)), channels: [], attribution: [], dimension,
      comparison: buildComparison({ views: 0, clicks: 0, leads: 0 }, { views: 0, clicks: 0, leads: 0 }),
      range,
    };
  }
  // 半开区间 [from, to)：闭区间会让边界那天在两段里各计一次。
  // $2/$3 为区间端点，$4/$5 为上一段端点（环比）。
  const window = `created_at >= $2 AND created_at < $3`;
  const base = `FROM analytics_events WHERE page_id = ANY($1) AND ${window}`;
  const args = [ids, range.from, range.to];
  const prevArgs = [ids, prev.from, prev.to];

  const [
    totalsRes, seriesRes, channelsRes, attrEventsRes, attrLeadsRes, leadsRes, formErrorsRes,
    prevEventsRes, prevLeadsRes,
  ] = await Promise.all([
    // unique_views 是去重访客；identified_views 数的是这段区间里有多少条 page_view
    // 带得上 visitor_hash——用来区分「真的 0 个访客」与「这段时间根本没采集」。
    // ⚠️ 中文只能写在 JS 注释里，不能写进 SQL 字符串：
    // no-hardcoded-cjk 的扫描会剥掉 // 注释，但剥不掉模板串里的 -- 注释。
    pool.query(`SELECT
        count(*) FILTER (WHERE event='page_view')::int   AS views,
        count(*) FILTER (WHERE event='cta_click')::int   AS clicks,
        count(*) FILTER (WHERE event='form_start')::int  AS form_starts,
        count(*) FILTER (WHERE event='form_submit')::int AS form_submits,
        count(DISTINCT visitor_hash) FILTER (WHERE event='page_view')::int AS unique_views,
        count(*) FILTER (WHERE event='page_view' AND visitor_hash IS NOT NULL)::int AS identified_views
       ${base}`, args),
    pool.query(`SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS date,
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base} GROUP BY 1 ORDER BY 1`, args),
    pool.query(`SELECT COALESCE(channel,'external') AS channel, count(*)::int AS clicks
       ${base} AND event='cta_click' GROUP BY 1 ORDER BY clicks DESC`, args),
    // 归因下钻（曝光/点击侧）。dimCol 来自 ATTRIBUTION_DIMENSIONS 白名单，非用户输入。
    pool.query(`SELECT COALESCE(${dimCol},$4) AS value,
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base} AND event IN ('page_view','cta_click') GROUP BY 1`, [...args, UNLABELED]),
    // 归因下钻（线索侧）：leads 表独立统计，与曝光侧在 mergeAttribution 里合并。
    pool.query(`SELECT COALESCE(${dimCol},$4) AS value, count(*)::int AS leads
       FROM leads WHERE page_id = ANY($1) AND ${window} GROUP BY 1`, [...args, UNLABELED]),
    // 线索来自独立的 leads 表（含 PII），与无 PII 的 analytics_events 分开统计。
    pool.query(`SELECT count(*)::int AS leads
       FROM leads WHERE page_id = ANY($1) AND ${window}`, args),
    pool.query(`SELECT COALESCE(detail,'unknown') AS detail, count(*)::int AS count
       ${base} AND event='form_error' GROUP BY 1 ORDER BY count DESC`, args),
    // 环比：紧邻等长上一段，只取三个核心指标（其余维度的环比没人逐个看）
    pool.query(`SELECT
        count(*) FILTER (WHERE event='page_view')::int AS views,
        count(*) FILTER (WHERE event='cta_click')::int AS clicks
       ${base}`, prevArgs),
    pool.query(`SELECT count(*)::int AS leads
       FROM leads WHERE page_id = ANY($1) AND ${window}`, prevArgs),
  ]);

  const v = Number(totalsRes.rows[0]?.views ?? 0);
  const c = Number(totalsRes.rows[0]?.clicks ?? 0);
  const l = Number(leadsRes.rows[0]?.leads ?? 0);
  return {
    // 该区间一条带 visitor_hash 的曝光都没有 → 这段时间根本没采集（迁移 050 之前），
    // 必须是 null 而不是 0。「有曝光但 0 个访客」在数据上不可能，显示 0 只会误导。
    totals: summarize(
      v, c, l,
      Number(totalsRes.rows[0]?.identified_views ?? 0) > 0
        ? Number(totalsRes.rows[0]?.unique_views ?? 0)
        : null,
    ),
    funnel: buildFunnel(v, c, l),
    formFunnel: buildFormFunnel(
      Number(totalsRes.rows[0]?.form_starts ?? 0),
      Number(totalsRes.rows[0]?.form_submits ?? 0),
      formErrorsRes.rows.map((r) => ({ detail: r.detail as string, count: Number(r.count) })),
    ),
    series: buildSeries(
      seriesRes.rows.map((r) => ({ date: r.date as string, views: Number(r.views), clicks: Number(r.clicks) })),
      datesInRange(range),
    ),
    channels: channelsRes.rows.map((r) => ({ channel: r.channel as string, clicks: Number(r.clicks) })),
    attribution: mergeAttribution(
      attrEventsRes.rows.map((r) => ({ value: r.value as string, views: Number(r.views), clicks: Number(r.clicks) })),
      attrLeadsRes.rows.map((r) => ({ value: r.value as string, leads: Number(r.leads) })),
    ),
    dimension,
    comparison: buildComparison(
      { views: v, clicks: c, leads: l },
      {
        views: Number(prevEventsRes.rows[0]?.views ?? 0),
        clicks: Number(prevEventsRes.rows[0]?.clicks ?? 0),
        leads: Number(prevLeadsRes.rows[0]?.leads ?? 0),
      },
    ),
    range,
  };
}

export function buildComparison(
  current: { views: number; clicks: number; leads: number },
  previous: { views: number; clicks: number; leads: number },
): Comparison {
  return {
    previous,
    change: {
      views: changeRate(current.views, previous.views),
      clicks: changeRate(current.clicks, previous.clicks),
      leads: changeRate(current.leads, previous.leads),
    },
  };
}
