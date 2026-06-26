// lib/capi/events-store.ts
// capi_events 读写 + 状态机。
import pool from "@/lib/db";
import type { CapiProviderId } from "./types";

export const MAX_ATTEMPTS = 5;

export interface CapiEventRow {
  id: string;
  page_id: string;
  provider: CapiProviderId;
  event_name: string;
  event_id: string;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
}

/** 入队一条 pending 事件，返回新行 id（坏 page_id 等 FK 错误返回 null）。 */
export async function insertEvent(row: {
  pageId: string; provider: CapiProviderId; eventName: string; eventId: string; payload: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const res = await pool.query(
      `INSERT INTO capi_events (page_id, provider, event_name, event_id, payload)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [row.pageId, row.provider, row.eventName, row.eventId, JSON.stringify(row.payload)],
    );
    return res.rows[0].id;
  } catch {
    return null;
  }
}

export async function getEventsByIds(ids: string[]): Promise<CapiEventRow[]> {
  if (ids.length === 0) return [];
  const res = await pool.query(`SELECT * FROM capi_events WHERE id = ANY($1)`, [ids]);
  return res.rows;
}

/** 取待重试事件（cron 用）。 */
export async function getRetryableEvents(limit = 100): Promise<CapiEventRow[]> {
  const res = await pool.query(
    `SELECT * FROM capi_events
      WHERE status IN ('pending','failed') AND attempts < $1 AND created_at > NOW() - INTERVAL '3 days'
      ORDER BY created_at ASC LIMIT $2`,
    [MAX_ATTEMPTS, limit],
  );
  return res.rows;
}

export async function markSent(id: string): Promise<void> {
  await pool.query(`UPDATE capi_events SET status='sent', sent_at=NOW(), updated_at=NOW() WHERE id=$1`, [id]);
}

/** 记录一次失败：attempts+1，达上限置 failed 终态，否则保持 pending。 */
export async function markFailure(id: string, attempts: number, error: string): Promise<void> {
  const next = attempts + 1;
  const status = next >= MAX_ATTEMPTS ? "failed" : "pending";
  await pool.query(
    `UPDATE capi_events SET attempts=$2, status=$3, last_error=$4, updated_at=NOW() WHERE id=$1`,
    [id, next, status, error.slice(0, 500)],
  );
}
