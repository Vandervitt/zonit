// lib/leads/validate.ts
// 线索提交校验（纯函数）：截断 + 至少一个联系方式 + 联系方式基本格式。
import { LEAD_CONTACT_FIELDS } from "@/types/schema.draft";

export interface LeadPayload {
  name?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  telegram?: string;
  message?: string;
}

export type ValidateResult =
  | { ok: true; payload: LeadPayload }
  | { ok: false; error: string };

const MAX = { name: 200, email: 200, phone: 200, whatsapp: 200, telegram: 200, message: 2000 } as const;
type Field = keyof typeof MAX;
const FIELDS: Field[] = ["name", "email", "phone", "whatsapp", "telegram", "message"];

const clean = (v: unknown, n: number): string =>
  typeof v === "string" ? v.trim().slice(0, n) : "";

export function validateLeadSubmission(input: Record<string, unknown>): ValidateResult {
  const payload: LeadPayload = {};
  for (const f of FIELDS) {
    const val = clean(input[f], MAX[f]);
    if (val) payload[f] = val;
  }
  // 至少一个联系方式
  const hasContact = LEAD_CONTACT_FIELDS.some((f) => payload[f]);
  if (!hasContact) return { ok: false, error: "need_contact" };
  // 基本格式
  if (payload.email && !payload.email.includes("@")) return { ok: false, error: "bad_email" };
  if (payload.phone && !/^[+\d\s-]+$/.test(payload.phone)) return { ok: false, error: "bad_phone" };
  return { ok: true, payload };
}
