// lib/capi/events-store.ts
// capi_events 读写 + 状态机。
import pool from "@/lib/db";
import type { CapiProviderId } from "./types";
import type { CapiProviderHealth } from "./health";

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

/**
 * 租户维度的回传健康度（后台面板用）。
 *
 * 为什么必须给出来：CAPI 配好之后是纯服务端行为，页面上看不出任何迹象。
 * 不暴露状态的话，token 过期、Dataset 填错这类问题会一直静默失败，
 * 而用户是靠广告后台的转化数变少才发现的——那时已经烧掉几周预算。
 */
export async function getCapiHealth(userId: string, days: number): Promise<CapiProviderHealth[]> {
  const res = await pool.query(
    `SELECT e.provider,
            count(*) FILTER (WHERE e.status='sent')::int    AS sent,
            count(*) FILTER (WHERE e.status='pending')::int AS pending,
            count(*) FILTER (WHERE e.status='failed')::int  AS failed,
            (ARRAY_AGG(e.last_error ORDER BY e.updated_at DESC)
               FILTER (WHERE e.last_error IS NOT NULL))[1]  AS last_error,
            MAX(e.updated_at) FILTER (WHERE e.last_error IS NOT NULL) AS last_error_at
       FROM capi_events e
       JOIN landing_pages p ON p.id = e.page_id
      WHERE p.user_id = $1 AND e.created_at >= now() - ($2 || ' days')::interval
      GROUP BY e.provider
      ORDER BY e.provider`,
    [userId, days],
  );
  return res.rows.map((r) => ({
    provider: r.provider as CapiProviderId,
    sent: Number(r.sent), pending: Number(r.pending), failed: Number(r.failed),
    lastError: r.last_error ?? null,
    lastErrorAt: r.last_error_at ? new Date(r.last_error_at).toISOString() : null,
  }));
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
