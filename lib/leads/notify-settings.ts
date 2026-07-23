import { randomBytes } from "node:crypto";
import pool from "@/lib/db";

export interface LeadNotifySettings {
  user_id: string;
  email_enabled: boolean;
  webhook_enabled: boolean;
  webhook_url: string | null;
  webhook_secret: string | null;
  weekly_digest_enabled: boolean;
}

/** 该租户设置（不存在返回默认：邮件开、周报开、webhook 关）。 */
export async function getLeadNotifySettings(userId: string): Promise<LeadNotifySettings> {
  const res = await pool.query(`SELECT * FROM lead_notification_settings WHERE user_id = $1`, [userId]);
  return (
    res.rows[0] ?? {
      user_id: userId,
      email_enabled: true,
      webhook_enabled: false,
      webhook_url: null,
      webhook_secret: null,
      weekly_digest_enabled: true,
    }
  );
}

/** upsert 设置。有 URL 且无密钥时自动生成一枚；清空 URL 时清密钥。返回最终设置。 */
export async function upsertLeadNotifySettings(
  userId: string,
  fields: { email_enabled: boolean; webhook_enabled: boolean; webhook_url: string | null; weekly_digest_enabled: boolean },
): Promise<LeadNotifySettings> {
  const res = await pool.query(
    `INSERT INTO lead_notification_settings (user_id, email_enabled, webhook_enabled, webhook_url, webhook_secret, weekly_digest_enabled, updated_at)
       VALUES ($1, $2, $3, $4::text, CASE WHEN $4::text IS NOT NULL THEN $5 ELSE NULL END, $6, NOW())
     ON CONFLICT (user_id) DO UPDATE SET
       email_enabled = EXCLUDED.email_enabled,
       webhook_enabled = EXCLUDED.webhook_enabled,
       webhook_url = EXCLUDED.webhook_url,
       webhook_secret = CASE
         WHEN EXCLUDED.webhook_url IS NULL THEN NULL
         ELSE COALESCE(lead_notification_settings.webhook_secret, EXCLUDED.webhook_secret)
       END,
       weekly_digest_enabled = EXCLUDED.weekly_digest_enabled,
       updated_at = NOW()
     RETURNING *`,
    [userId, fields.email_enabled, fields.webhook_enabled, fields.webhook_url, randomBytes(24).toString("hex"), fields.weekly_digest_enabled],
  );
  return res.rows[0];
}

/** 轮换 webhook 密钥（旧密钥立即失效）。返回新密钥或 null（无 URL 时不生成）。 */
export async function rotateWebhookSecret(userId: string): Promise<string | null> {
  const res = await pool.query(
    `UPDATE lead_notification_settings
        SET webhook_secret = CASE WHEN webhook_url IS NOT NULL THEN $2 ELSE webhook_secret END, updated_at = NOW()
      WHERE user_id = $1 RETURNING webhook_secret`,
    [userId, randomBytes(24).toString("hex")],
  );
  return res.rows[0]?.webhook_secret ?? null;
}
