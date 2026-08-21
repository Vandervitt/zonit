// lib/super-admin/page-check-views.ts
//
// 「哪些自检报告链接被别人打开过」的读取侧。
//
// ## 为什么筛选条件是「有非创建者访问」而不是「全部报告」
//
// page_check_reports 里绝大多数是公开工具的自助使用——访客自己查自己的页面，
// 创建和查看是同一个人。这类记录对触达衡量毫无信息量，且数量会淹没一切。
//
// 真正有信息量的是：**这条链接被创建者以外的人打开过**。外发场景下这恰好等价于
// 「收件人点开了报告」——链接是一对一发出去的，不存在第三方偶然发现的路径
// （报告页 noindex，id 21 位不可枚举）。
//
// ## 这份数据的三条边界，读的时候必须记住
//
// 1. **只统计上线之后的访问。** 浏览记录表是新加的，此前发出去的链接在被再次
//    打开之前一律显示 0 次——那是「没有数据」，不是「没人看过」。
// 2. **创建者识别依赖 IP 哈希。** 自己换了网络再回看自己的报告，会被算成
//    非创建者访问。宁可多报也不漏报，但看到 1 次访问时要想到这个可能。
// 3. **机器人计数单列，不混进人类计数。** 判定见 lib/tools/bot-ua.ts，
//    那份名单注定不完整，所以原始 UA 一直留在库里，口径随时可以重算。
import pool from "@/lib/db";

export interface OutreachLinkRow {
  key: string;
  kind: "report" | "batch";
  id: string;
  /** 单页报告是被检查的 URL；对比报告是其中第一个 URL。 */
  label: string;
  /** 对比报告包含的页数；单页恒为 1。 */
  pageCount: number;
  createdAt: string;
  expiresAt: string;
  humanViews: number;
  uniqueHumans: number;
  botViews: number;
  firstHumanAt: string | null;
  lastHumanAt: string | null;
}

/**
 * 人类访问的统计列，两条查询共用。
 *
 * ⚠️ 次数一律 `COUNT(DISTINCT v.id)`。对比批次那条查询要 JOIN batch_items
 * 才能数出页数，而那个 JOIN 会把每条浏览记录复制成 N 行（N = 批次内页数）——
 * 用 COUNT(v.id) 的话，1 次访问会显示成 N 次。本地走查真的踩到过。
 */
const VIEW_AGGREGATES = `
  COUNT(DISTINCT v.id) FILTER (WHERE NOT v.is_bot AND NOT v.is_creator)::int AS human_views,
  COUNT(DISTINCT v.ip_hash) FILTER (WHERE NOT v.is_bot AND NOT v.is_creator)::int AS unique_humans,
  COUNT(DISTINCT v.id) FILTER (WHERE v.is_bot)::int AS bot_views,
  MIN(v.viewed_at) FILTER (WHERE NOT v.is_bot AND NOT v.is_creator) AS first_human_at,
  MAX(v.viewed_at) FILTER (WHERE NOT v.is_bot AND NOT v.is_creator) AS last_human_at
`;

function iso(value: string | Date | null): string | null {
  return value ? new Date(value).toISOString() : null;
}

/**
 * 列出被创建者以外的人打开过的报告与对比链接，按最近一次访问倒序。
 *
 * HAVING 而不是 WHERE：筛选依据是聚合结果（有没有非创建者访问），
 * 逐行判断做不到。
 */
export async function listOpenedLinks(limit = 200): Promise<OutreachLinkRow[]> {
  const [reports, batches] = await Promise.all([
    pool.query(
      `SELECT r.id, r.input_url, r.created_at, r.expires_at, ${VIEW_AGGREGATES}
         FROM page_check_reports r
         JOIN page_check_report_views v ON v.report_id = r.id
        GROUP BY r.id
       HAVING COUNT(DISTINCT v.id) FILTER (WHERE NOT v.is_bot AND NOT v.is_creator) > 0
        ORDER BY MAX(v.viewed_at) DESC
        LIMIT $1`,
      [limit],
    ),
    pool.query(
      `SELECT b.id, b.created_at, b.expires_at, ${VIEW_AGGREGATES},
              COUNT(DISTINCT i.report_id)::int AS page_count,
              MIN(r.input_url) AS input_url
         FROM page_check_batches b
         JOIN page_check_report_views v ON v.batch_id = b.id
         LEFT JOIN page_check_batch_items i ON i.batch_id = b.id
         LEFT JOIN page_check_reports r ON r.id = i.report_id
        GROUP BY b.id
       HAVING COUNT(DISTINCT v.id) FILTER (WHERE NOT v.is_bot AND NOT v.is_creator) > 0
        ORDER BY MAX(v.viewed_at) DESC
        LIMIT $1`,
      [limit],
    ),
  ]);

  const rows: OutreachLinkRow[] = [
    ...reports.rows.map((r) => ({
      key: `report:${r.id}`,
      kind: "report" as const,
      id: r.id as string,
      label: (r.input_url as string) ?? "",
      pageCount: 1,
      createdAt: new Date(r.created_at).toISOString(),
      expiresAt: new Date(r.expires_at).toISOString(),
      humanViews: r.human_views,
      uniqueHumans: r.unique_humans,
      botViews: r.bot_views,
      firstHumanAt: iso(r.first_human_at),
      lastHumanAt: iso(r.last_human_at),
    })),
    ...batches.rows.map((b) => ({
      key: `batch:${b.id}`,
      kind: "batch" as const,
      id: b.id as string,
      label: (b.input_url as string) ?? "",
      pageCount: b.page_count ?? 0,
      createdAt: new Date(b.created_at).toISOString(),
      expiresAt: new Date(b.expires_at).toISOString(),
      humanViews: b.human_views,
      uniqueHumans: b.unique_humans,
      botViews: b.bot_views,
      firstHumanAt: iso(b.first_human_at),
      lastHumanAt: iso(b.last_human_at),
    })),
  ];

  // 两条查询各自排好序，合并后要重新按最近访问排一次。
  rows.sort((a, b) => (b.lastHumanAt ?? "").localeCompare(a.lastHumanAt ?? ""));
  return rows.slice(0, limit);
}

export interface OutreachSummary {
  /** 有浏览记录的链接总数（含只被机器人抓过的）。 */
  trackedLinks: number;
  /** 被真人打开过的链接数。 */
  openedLinks: number;
  /** 机器人抓取次数——单列出来才知道「打开」里混了多少噪音。 */
  botViews: number;
}

export async function getOutreachSummary(): Promise<OutreachSummary> {
  const res = await pool.query(`
    SELECT
      COUNT(DISTINCT COALESCE(report_id, batch_id))::int AS tracked_links,
      COUNT(DISTINCT COALESCE(report_id, batch_id))
        FILTER (WHERE NOT is_bot AND NOT is_creator)::int AS opened_links,
      COUNT(*) FILTER (WHERE is_bot)::int AS bot_views
    FROM page_check_report_views
  `);
  const row = res.rows[0];
  return {
    trackedLinks: row?.tracked_links ?? 0,
    openedLinks: row?.opened_links ?? 0,
    botViews: row?.bot_views ?? 0,
  };
}
