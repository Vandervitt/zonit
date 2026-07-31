// lib/leads/store.ts
// leads 读写。公开提交用 insertLead；后台查询/操作均按 user 隔离（经 landing_pages JOIN）。
import pool from "@/lib/db";
import { isBadPageIdError } from "@/lib/db-errors";
import type { LeadPayload } from "./validate";

export interface LeadRow {
  id: string;
  page_id: string;
  page_name: string;
  payload: LeadPayload;
  channel: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  is_read: boolean;
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
}

/**
 * 公开提交入库。坏 page_id 直接抛出交调用方丢弃；其余失败重试一次
 * （Neon 瞬断与连接池抖动占多数），仍失败则抛给调用方走兜底留存。
 */
export async function insertLead(pageId: string, payload: LeadPayload, attr: LeadAttribution): Promise<string> {
  const run = () =>
    pool.query(
      `INSERT INTO leads (page_id, payload, channel, utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [pageId, JSON.stringify(payload), attr.channel ?? null, attr.utm_source ?? null, attr.utm_medium ?? null, attr.utm_campaign ?? null],
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

/** 列出本租户线索（经 page 关联隔离）。 */
export async function listLeads(
  userId: string,
  opts: { pageId?: string; unreadOnly?: boolean } = {},
): Promise<LeadRow[]> {
  const conds = ["p.user_id = $1"];
  const vals: unknown[] = [userId];
  if (opts.pageId) { vals.push(opts.pageId); conds.push(`l.page_id = $${vals.length}`); }
  if (opts.unreadOnly) conds.push(`l.is_read = false`);
  const res = await pool.query(
    `SELECT l.*, p.name AS page_name,
            d.status AS notify_webhook_status, d.last_error AS notify_webhook_error
       FROM leads l
       JOIN landing_pages p ON p.id = l.page_id
       LEFT JOIN webhook_deliveries d ON d.id = l.notify_webhook_delivery_id
      WHERE ${conds.join(" AND ")}
      ORDER BY l.created_at DESC`,
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
