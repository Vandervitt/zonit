// lib/capi/hash.ts
// CAPI 用户数据标准化 + SHA-256（平台要求小写/去格式后哈希）。
import { createHash } from "node:crypto";

export function sha256(input: string): string {
  return createHash("sha256").update(input, "utf8").digest("hex");
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/** 仅保留数字（去 +、空格、括号、横线）。 */
export function normalizePhone(phone: string): string {
  return phone.replace(/\D/g, "");
}

export function hashEmail(email?: string): string | undefined {
  if (!email || !email.trim()) return undefined;
  return sha256(normalizeEmail(email));
}

export function hashPhone(phone?: string): string | undefined {
  if (!phone || !phone.trim()) return undefined;
  const n = normalizePhone(phone);
  return n ? sha256(n) : undefined;
}
