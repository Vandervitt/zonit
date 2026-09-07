import pool from "@/lib/db";
import { UserRole } from "@/lib/constants/auth";
import { getFounderContact } from "@/lib/platform-settings";

/**
 * 合并超管收件人：环境变量白名单 + 库里 role=SUPER_ADMIN 的账号。
 * 纯函数，便于单测；大小写归一 + 去重 + 去空。
 */
export function mergeAdminRecipients(envEmails: string | undefined | null, dbEmails: string[]): string[] {
  const raw = [...(envEmails ?? "").split(","), ...dbEmails];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const email = (item ?? "").trim().toLowerCase();
    if (!email || !email.includes("@") || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

/**
 * 超管通知收件人。ADMIN_EMAILS 白名单与库内超管账号取并集；
 * 两者皆空时回落到平台设置里的创始人邮箱（与反馈通知同一出口）。
 */
export async function getSuperAdminRecipients(): Promise<string[]> {
  let dbEmails: string[] = [];
  try {
    const res = await pool.query(
      "SELECT email FROM users WHERE role = $1 AND disabled_at IS NULL AND email IS NOT NULL",
      [UserRole.SUPER_ADMIN],
    );
    dbEmails = res.rows.map((r) => r.email as string);
  } catch (err) {
    // 库不可用不应让通知整体失效：仍可用环境变量白名单发出。
    console.error("load super admin emails failed:", err);
  }
  const merged = mergeAdminRecipients(process.env.ADMIN_EMAILS, dbEmails);
  if (merged.length > 0) return merged;
  try {
    const { email } = await getFounderContact();
    return mergeAdminRecipients(email, []);
  } catch (err) {
    console.error("load founder email failed:", err);
    return [];
  }
}
