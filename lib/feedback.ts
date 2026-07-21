import pool from "@/lib/db";

// 用户反馈：埋在情绪高点收集，存 feedback 表，超管收件箱可翻看。

export const FEEDBACK_SOURCES = ["unpublish", "delete", "publish_success", "error", "general"] as const;
export type FeedbackSource = (typeof FEEDBACK_SOURCES)[number];

export interface FeedbackContext {
  pageId?: string;
  pageName?: string;
  plan?: string;
  url?: string;
  errorId?: string;
  reason?: string; // 快捷原因标签（如「太复杂」「效果不好」）
}

export interface FeedbackRow {
  id: string;
  userId: string | null;
  email: string | null;
  source: FeedbackSource;
  message: string;
  context: FeedbackContext;
  isRead: boolean;
  createdAt: string;
}

export interface CreateFeedbackInput {
  userId: string | null;
  email: string | null;
  source: FeedbackSource;
  message: string;
  context?: FeedbackContext;
}

export async function createFeedback(input: CreateFeedbackInput): Promise<void> {
  await pool.query(
    `INSERT INTO feedback (user_id, email, source, message, context)
     VALUES ($1, $2, $3, $4, $5::jsonb)`,
    [input.userId, input.email, input.source, input.message, JSON.stringify(input.context ?? {})],
  );
}

export async function listFeedback(limit = 200): Promise<FeedbackRow[]> {
  const result = await pool.query(
    `SELECT id, user_id, email, source, message, context, is_read, created_at
       FROM feedback ORDER BY created_at DESC LIMIT $1`,
    [limit],
  );
  return result.rows.map((r) => ({
    id: String(r.id),
    userId: (r.user_id as string | null) ?? null,
    email: (r.email as string | null) ?? null,
    source: r.source as FeedbackSource,
    message: r.message as string,
    context: (r.context as FeedbackContext) ?? {},
    isRead: Boolean(r.is_read),
    createdAt: (r.created_at as Date).toISOString(),
  }));
}

export async function markFeedbackRead(id: string, isRead: boolean): Promise<boolean> {
  const result = await pool.query(`UPDATE feedback SET is_read = $2 WHERE id = $1`, [id, isRead]);
  return (result.rowCount ?? 0) > 0;
}

export async function countUnreadFeedback(): Promise<number> {
  const result = await pool.query(`SELECT COUNT(*)::int AS n FROM feedback WHERE is_read = false`);
  return (result.rows[0]?.n as number) ?? 0;
}
