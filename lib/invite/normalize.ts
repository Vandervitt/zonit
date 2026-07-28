// 邀请入参的纯函数校验层。独立于路由文件，避免单测因 import 路由而连带加载
// next-auth（其在 vitest 下无法解析 next/server）。
import { normalizeEmail } from "@/lib/auth/otp";

/** 链接有效期上下限（小时）：1 小时 ~ 30 天。 */
export const MIN_LINK_HOURS = 1;
export const MAX_LINK_HOURS = 720;
export const DEFAULT_LINK_HOURS = 24;

/** 单次批量邀请的邮箱数上限：逐封串行发送，过大会拖长请求并触发 Resend 限流。 */
export const MAX_INVITE_BATCH = 50;

export type InviteSkipReason = "already_registered" | "duplicate" | "invalid_email";

export interface InviteResult {
  sent: string[];
  skipped: { email: string; reason: InviteSkipReason }[];
  failed: { email: string; reason: string }[];
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 归一化 + 去重 + 校验格式，保留跳过原因供前端逐条回报。 */
export function normalizeInviteEmails(raw: unknown): {
  emails: string[];
  skipped: { email: string; reason: InviteSkipReason }[];
} {
  const list = Array.isArray(raw) ? raw : typeof raw === "string" ? [raw] : [];
  const emails: string[] = [];
  const skipped: { email: string; reason: InviteSkipReason }[] = [];
  const seen = new Set<string>();
  for (const item of list) {
    if (typeof item !== "string") continue;
    const trimmed = item.trim();
    if (!trimmed) continue;
    if (!EMAIL_RE.test(trimmed)) {
      skipped.push({ email: trimmed, reason: "invalid_email" });
      continue;
    }
    const email = normalizeEmail(trimmed);
    if (seen.has(email)) {
      skipped.push({ email: trimmed, reason: "duplicate" });
      continue;
    }
    seen.add(email);
    emails.push(email);
  }
  return { emails, skipped };
}

/** 把超管填的小时数夹到合法区间；非法/缺省回落到 24 小时。 */
export function resolveLinkHours(raw: unknown): number {
  const n = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(n)) return DEFAULT_LINK_HOURS;
  return Math.min(MAX_LINK_HOURS, Math.max(MIN_LINK_HOURS, Math.floor(n)));
}
