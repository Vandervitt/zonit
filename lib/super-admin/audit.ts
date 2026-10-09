// 超管操作审计：由「变更前的行 + 补丁」算出要记录的条目。纯函数，便于测试。
import type { AdminUserPatch } from "./users-db";

export type AuditAction = "comp_plan" | "role" | "disabled" | "is_internal";

export interface AuditEntry {
  action: AuditAction;
  detail: { before: unknown; after: unknown };
}

export interface AuditBefore {
  comp_plan: string | null;
  comp_plan_expires_at: string | Date | null;
  role: string;
  disabled_at: string | Date | null;
  is_internal: boolean;
}

const isoOrNull = (v: string | Date | null | undefined) => (v ? new Date(v).toISOString() : null);

export function auditEntries(before: AuditBefore, patch: AdminUserPatch): AuditEntry[] {
  const out: AuditEntry[] = [];

  if (patch.compPlan !== undefined || patch.compPlanExpiresAt !== undefined) {
    const prev = { plan: before.comp_plan, expiresAt: isoOrNull(before.comp_plan_expires_at) };
    const next = {
      plan: patch.compPlan !== undefined ? patch.compPlan : prev.plan,
      expiresAt: patch.compPlanExpiresAt !== undefined ? isoOrNull(patch.compPlanExpiresAt) : prev.expiresAt,
    };
    if (prev.plan !== next.plan || prev.expiresAt !== next.expiresAt) {
      out.push({ action: "comp_plan", detail: { before: prev, after: next } });
    }
  }
  if (patch.role !== undefined && patch.role !== before.role) {
    out.push({ action: "role", detail: { before: before.role, after: patch.role } });
  }
  const wasDisabled = Boolean(before.disabled_at);
  if (patch.disabled !== undefined && patch.disabled !== wasDisabled) {
    out.push({ action: "disabled", detail: { before: wasDisabled, after: patch.disabled } });
  }
  if (patch.isInternal !== undefined && patch.isInternal !== before.is_internal) {
    out.push({ action: "is_internal", detail: { before: before.is_internal, after: patch.isInternal } });
  }
  return out;
}
