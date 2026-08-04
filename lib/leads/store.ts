// lib/leads/store.ts
// leads 读写。公开提交用 insertLead；后台查询/操作均按 user 隔离（经 landing_pages JOIN）。
import pool from "@/lib/db";
import { isBadPageIdError } from "@/lib/db-errors";
import type { LeadPayload } from "./validate";

// 常量与规整逻辑在 follow-up.ts（客户端也要用，不能从本文件引——本文件 import 了 pg 池）。
export * from "./follow-up";

export interface LeadRow {
  id: string;
  page_id: string;
  page_name: string;
  payload: LeadPayload;
  channel: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_term: string | null;
  utm_content: string | null;
  /** 平台点击 ID：用于把这条线索拿回广告后台逐条对账。 */
  gclid: string | null;
  fbclid: string | null;
  ttclid: string | null;
  is_read: boolean;
  /** 跟进备注（「这个客户说下周再聊」这类信息此前无处可记）。 */
  note: string | null;
  tags: string[];
  /** 归档时间；归档的线索从默认视图收起，但从不删除——线索是花钱买来的。 */
  archived_at: string | null;
  created_at: string;
  /** 通知送达可见性：邮件为平台侧发送结果，webhook 状态由投递表联查。 */
  notify_email: "off" | "sent" | "failed" | null;
  notify_email_error: string | null;
  notify_webhook_status: "pending" | "sent" | "failed" | null;
  notify_webhook_error: string | null;
}

export interface LeadAttribution {
  channel?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
}

/** INSERT 的归因列顺序——插入语句与兜底重投共用，避免两处各写一份错位。 */
const ATTR_COLUMNS = [
  "channel", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "gclid", "fbclid", "ttclid",
] as const;

/**
 * 公开提交入库。坏 page_id 直接抛出交调用方丢弃；其余失败重试一次
 * （Neon 瞬断与连接池抖动占多数），仍失败则抛给调用方走兜底留存。
 */
export async function insertLead(pageId: string, payload: LeadPayload, attr: LeadAttribution): Promise<string> {
  // $1 page_id、$2 payload，其后按 ATTR_COLUMNS 顺序展开归因列。
  const placeholders = ATTR_COLUMNS.map((_, i) => `$${i + 3}`).join(", ");
  const run = () =>
    pool.query(
      `INSERT INTO leads (page_id, payload, ${ATTR_COLUMNS.join(", ")})
       VALUES ($1, $2, ${placeholders}) RETURNING id`,
      [pageId, JSON.stringify(payload), ...ATTR_COLUMNS.map((c) => attr[c] ?? null)],
    );
  try {
    return (await run()).rows[0].id;
  } catch (err) {
    if (isBadPageIdError(err)) throw err;
    await new Promise((r) => setTimeout(r, 300));
    return (await run()).rows[0].id;
  }
}

/** 邮件通知结果回写。best-effort：写失败不影响线索本身，只丢一次可见性。 */
export async function setLeadEmailNotify(leadId: string, status: "off" | "sent" | "failed", error?: string): Promise<void> {
  try {
    await pool.query(`UPDATE leads SET notify_email = $2, notify_email_error = $3 WHERE id = $1`, [leadId, status, error ?? null]);
  } catch (err) {
    console.error("[leads/store] 回写邮件通知结果失败:", err);
  }
}

/** 关联 webhook 投递行；状态本身不复制，读取时联查（重试会改状态，复制必过期）。 */
export async function setLeadWebhookDelivery(leadId: string, deliveryId: string): Promise<void> {
  try {
    await pool.query(`UPDATE leads SET notify_webhook_delivery_id = $2 WHERE id = $1`, [leadId, deliveryId]);
  } catch (err) {
    console.error("[leads/store] 回写 webhook 投递关联失败:", err);
  }
}

export interface LeadFilter {
  pageId?: string;
  unreadOnly?: boolean;
  /** 单个标签筛选。 */
  tag?: string;
  /** 默认只看未归档；true 时只看已归档（归档区是独立视图，不与默认视图混在一起）。 */
  archived?: boolean;
  /** 不传即不分页（CSV 导出要全量）。 */
  limit?: number;
  offset?: number;
}

/** 筛选条件 → WHERE 片段与参数。列表与计数必须同源，否则总数和页数对不上。 */
function buildLeadFilter(userId: string, opts: LeadFilter): { where: string; vals: unknown[] } {
  const conds = ["p.user_id = $1"];
  const vals: unknown[] = [userId];
  if (opts.pageId) { vals.push(opts.pageId); conds.push(`l.page_id = $${vals.length}`); }
  if (opts.unreadOnly) conds.push(`l.is_read = false`);
  if (opts.tag) { vals.push([opts.tag]); conds.push(`l.tags @> $${vals.length}`); }
  // 归档与未归档互斥且必须显式二选一：把已处理的线索混进默认视图，
  // 归档这个动作就没有意义了。
  conds.push(opts.archived ? `l.archived_at IS NOT NULL` : `l.archived_at IS NULL`);
  return { where: conds.join(" AND "), vals };
}

/** 更新备注 / 标签 / 归档状态（按 user 隔离）。字段未传即不改动。 */
export async function updateLeadFollowUp(
  id: string,
  userId: string,
  fields: { note?: string | null; tags?: string[]; archived?: boolean },
): Promise<LeadRow | null> {
  const set: string[] = [];
  const vals: unknown[] = [id, userId];
  if (fields.note !== undefined) { vals.push(fields.note); set.push(`note = $${vals.length}`); }
  if (fields.tags !== undefined) { vals.push(fields.tags); set.push(`tags = $${vals.length}`); }
  if (fields.archived !== undefined) {
    set.push(`archived_at = ${fields.archived ? "NOW()" : "NULL"}`);
  }
  if (set.length === 0) return null;
  const res = await pool.query(
    `UPDATE leads l SET ${set.join(", ")}
       FROM landing_pages p
      WHERE l.id = $1 AND p.id = l.page_id AND p.user_id = $2
      RETURNING l.*, p.name AS page_name`,
    vals,
  );
  return res.rows[0] ?? null;
}

/** 本租户用过的全部标签（筛选器的候选项）。 */
export async function listLeadTags(userId: string): Promise<string[]> {
  const res = await pool.query(
    `SELECT DISTINCT unnest(l.tags) AS tag
       FROM leads l JOIN landing_pages p ON p.id = l.page_id
      WHERE p.user_id = $1
      ORDER BY tag`,
    [userId],
  );
  return res.rows.map((r) => r.tag as string);
}

/** 满足筛选条件的线索总数（分页器用）。 */
export async function countLeads(userId: string, opts: LeadFilter = {}): Promise<number> {
  const { where, vals } = buildLeadFilter(userId, opts);
  const res = await pool.query(
    `SELECT count(*)::int AS n FROM leads l JOIN landing_pages p ON p.id = l.page_id WHERE ${where}`,
    vals,
  );
  return Number(res.rows[0]?.n ?? 0);
}

/** 列出本租户线索（经 page 关联隔离）。 */
export async function listLeads(
  userId: string,
  opts: LeadFilter = {},
): Promise<LeadRow[]> {
  const { where: whereSql, vals } = buildLeadFilter(userId, opts);
  const conds = [whereSql];
  let paging = "";
  if (opts.limit !== undefined) {
    vals.push(opts.limit);
    paging = ` LIMIT $${vals.length}`;
    if (opts.offset) { vals.push(opts.offset); paging += ` OFFSET $${vals.length}`; }
  }
  const res = await pool.query(
    `SELECT l.*, p.name AS page_name,
            d.status AS notify_webhook_status, d.last_error AS notify_webhook_error
       FROM leads l
       JOIN landing_pages p ON p.id = l.page_id
       LEFT JOIN webhook_deliveries d ON d.id = l.notify_webhook_delivery_id
      WHERE ${conds.join(" AND ")}
      ORDER BY l.created_at DESC${paging}`,
    vals,
  );
  return res.rows;
}

export async function markLeadRead(id: string, userId: string, isRead: boolean): Promise<LeadRow | null> {
  const res = await pool.query(
    `UPDATE leads l SET is_read = $3
       FROM landing_pages p
      WHERE l.id = $1 AND p.id = l.page_id AND p.user_id = $2
      RETURNING l.*, p.name AS page_name`,
    [id, userId, isRead],
  );
  return res.rows[0] ?? null;
}

export async function deleteLead(id: string, userId: string): Promise<boolean> {
  const res = await pool.query(
    `DELETE FROM leads l USING landing_pages p
      WHERE l.id = $1 AND p.id = l.page_id AND p.user_id = $2
      RETURNING l.id`,
    [id, userId],
  );
  return res.rows.length > 0;
}
