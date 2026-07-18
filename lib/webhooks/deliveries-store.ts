// lib/webhooks/deliveries-store.ts
// webhook_deliveries 读写 + 状态机（镜像 capi/events-store）。
import pool from "@/lib/db";

export const MAX_ATTEMPTS = 5;

export interface WebhookDeliveryRow {
  id: string;
  user_id: string;
  page_id: string | null;
  payload: Record<string, unknown>;
  status: "pending" | "sent" | "failed";
  attempts: number;
}

/** 入队一条 pending 投递，返回新行 id（FK 等错误返回 null）。 */
export async function insertDelivery(row: {
  userId: string; pageId: string | null; payload: Record<string, unknown>;
}): Promise<string | null> {
  try {
    const res = await pool.query(
      `INSERT INTO webhook_deliveries (user_id, page_id, payload) VALUES ($1, $2, $3) RETURNING id`,
      [row.userId, row.pageId, JSON.stringify(row.payload)],
    );
    return res.rows[0].id;
  } catch {
    return null;
  }
}

export async function getDeliveriesByIds(ids: string[]): Promise<WebhookDeliveryRow[]> {
  if (ids.length === 0) return [];
  const res = await pool.query(`SELECT * FROM webhook_deliveries WHERE id = ANY($1)`, [ids]);
  return res.rows;
}

/** 取待重试投递（cron 用）。 */
export async function getRetryableDeliveries(limit = 100): Promise<WebhookDeliveryRow[]> {
  const res = await pool.query(
    `SELECT * FROM webhook_deliveries
      WHERE status IN ('pending','failed') AND attempts < $1 AND created_at > NOW() - INTERVAL '3 days'
      ORDER BY created_at ASC LIMIT $2`,
    [MAX_ATTEMPTS, limit],
  );
  return res.rows;
}

export async function markSent(id: string): Promise<void> {
  await pool.query(`UPDATE webhook_deliveries SET status='sent', sent_at=NOW(), updated_at=NOW() WHERE id=$1`, [id]);
}

/** 记录一次失败：attempts+1，达上限置 failed 终态，否则保持 pending。 */
export async function markFailure(id: string, attempts: number, error: string): Promise<void> {
  const next = attempts + 1;
  const status = next >= MAX_ATTEMPTS ? "failed" : "pending";
  await pool.query(
    `UPDATE webhook_deliveries SET attempts=$2, status=$3, last_error=$4, updated_at=NOW() WHERE id=$1`,
    [id, next, status, error.slice(0, 500)],
  );
}
