// AI 一键成页的异步任务记录。见 migrations/049_landing_page_ai_jobs.ts 的设计说明。
import pool from "@/lib/db";

export type AiJobStatus = "pending" | "succeeded" | "failed";

export interface AiJobRow {
  id: string;
  status: AiJobStatus;
  reason: string | null;
}

export async function createAiJob(userId: string, pageId: string): Promise<{ id: string }> {
  const result = await pool.query(
    `INSERT INTO landing_page_ai_jobs (user_id, page_id) VALUES ($1, $2) RETURNING id`,
    [userId, pageId],
  );
  return result.rows[0];
}

/** 越权（job 不属于该用户）与不存在同样返回 null，不区分对外暴露。 */
export async function getAiJob(id: string, userId: string): Promise<AiJobRow | null> {
  const result = await pool.query(
    `SELECT id, status, reason FROM landing_page_ai_jobs WHERE id = $1 AND user_id = $2`,
    [id, userId],
  );
  return result.rows[0] ?? null;
}

export async function markAiJobDone(id: string, status: "succeeded" | "failed", reason?: string): Promise<void> {
  await pool.query(
    `UPDATE landing_page_ai_jobs SET status = $2, reason = $3, updated_at = now() WHERE id = $1`,
    [id, status, reason ?? null],
  );
}
