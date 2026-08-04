// 归因下钻的维度定义与合并逻辑（纯函数，无 DB 依赖）。
//
// ⚠️ 刻意与 queries.ts 分开：queries.ts 顶部 import 了 pg 连接池，后台分析页是客户端
// 组件，从那里引常量会把 pg 打进浏览器包。任何需要被前端引用的分析常量都放这里。

/**
 * 归因下钻维度 → 实际列名。
 *
 * ⚠️ 列名不能走参数化（Postgres 参数只能出现在值的位置），所以维度**必须**先在这张
 * 白名单里查到才允许拼进 SQL。不要改成直接把入参当列名用。
 */
export const ATTRIBUTION_DIMENSIONS = {
  source: "utm_source",
  medium: "utm_medium",
  campaign: "utm_campaign",
  content: "utm_content",
  term: "utm_term",
} as const;

export type AttributionDimension = keyof typeof ATTRIBUTION_DIMENSIONS;

/** 默认看广告系列级：投放侧最常问的是「哪条广告带来的线索」。 */
export const DEFAULT_DIMENSION: AttributionDimension = "campaign";

/** 广告链接没带该维度时的归组名。与真实值 "unknown" 区分，故用中文括号形式。 */
export const UNLABELED = "(未标注)";

export function isAttributionDimension(v: unknown): v is AttributionDimension {
  return typeof v === "string" && v in ATTRIBUTION_DIMENSIONS;
}

/** 一个归因取值（如某个 campaign）在区间内的表现。 */
export interface AttributionRow {
  value: string;
  views: number;
  clicks: number;
  leads: number;
  /** 线索 / 曝光——横向比广告好坏就看它，不是看谁曝光多。 */
  cvr: number;
}

/**
 * 合并曝光/点击流水与线索两侧的分组结果。
 *
 * 两侧必须分开查再合：线索在 leads 表（含 PII），曝光在 analytics_events（无 PII），
 * 库里刻意不让它们 JOIN。合并后按线索降序——投放侧要先看到哪条广告真带来了询盘，
 * 曝光量只是并列时的次级排序。
 */
export function mergeAttribution(
  eventRows: { value: string; views: number; clicks: number }[],
  leadRows: { value: string; leads: number }[],
  limit = 20,
): AttributionRow[] {
  const map = new Map<string, AttributionRow>();
  const at = (value: string): AttributionRow => {
    const cur = map.get(value) ?? { value, views: 0, clicks: 0, leads: 0, cvr: 0 };
    map.set(value, cur);
    return cur;
  };
  for (const r of eventRows) { const row = at(r.value); row.views += r.views; row.clicks += r.clicks; }
  for (const r of leadRows) at(r.value).leads += r.leads;
  return [...map.values()]
    .map((r) => ({ ...r, cvr: r.views > 0 ? r.leads / r.views : 0 }))
    .sort((a, b) => b.leads - a.leads || b.views - a.views)
    .slice(0, limit);
}
