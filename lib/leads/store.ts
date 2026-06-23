// lib/leads/store.ts
// leads 读写。公开提交用 insertLead；后台查询/操作均按 user 隔离（经 landing_pages JOIN）。
import pool from "@/lib/db";
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
}

export interface LeadAttribution {
  channel?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
}

/** 公开提交入库；坏 page_id 触发 FK 错误由调用方 best-effort 处理。 */
export async function insertLead(pageId: string, payload: LeadPayload, attr: LeadAttribution): Promise<void> {
  await pool.query(
    `INSERT INTO leads (page_id, payload, channel, utm_source, utm_medium, utm_campaign)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [pageId, JSON.stringify(payload), attr.channel ?? null, attr.utm_source ?? null, attr.utm_medium ?? null, attr.utm_campaign ?? null],
  );
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
    `SELECT l.*, p.name AS page_name
       FROM leads l JOIN landing_pages p ON p.id = l.page_id
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

export async function countUnread(userId: string): Promise<number> {
  const res = await pool.query(
    `SELECT COUNT(*)::int AS n
       FROM leads l JOIN landing_pages p ON p.id = l.page_id
      WHERE p.user_id = $1 AND l.is_read = false`,
    [userId],
  );
  return res.rows[0].n;
}
