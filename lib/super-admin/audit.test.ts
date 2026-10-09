import { describe, it, expect } from "vitest";
import { auditEntries } from "./audit";

const before = {
  comp_plan: "pro", comp_plan_expires_at: "2026-11-01T00:00:00.000Z",
  role: "USER", disabled_at: null, is_internal: false,
};

describe("auditEntries", () => {
  it("每类变更一条，记录前后值", () => {
    expect(auditEntries(before, { role: "SUPER_ADMIN", disabled: true })).toEqual([
      { action: "role", detail: { before: "USER", after: "SUPER_ADMIN" } },
      { action: "disabled", detail: { before: false, after: true } },
    ]);
  });

  it("赠送套餐与到期合并为一条", () => {
    expect(auditEntries(before, { compPlan: "agency", compPlanExpiresAt: "2027-01-01T00:00:00.000Z" })).toEqual([
      {
        action: "comp_plan",
        detail: {
          before: { plan: "pro", expiresAt: "2026-11-01T00:00:00.000Z" },
          after: { plan: "agency", expiresAt: "2027-01-01T00:00:00.000Z" },
        },
      },
    ]);
  });

  it("值未变化不记录（重复点击不刷屏）", () => {
    expect(auditEntries(before, { role: "USER", disabled: false, isInternal: false })).toEqual([]);
  });

  it("库里的 Date 与补丁里的 ISO 字符串按时刻比较", () => {
    const b = { ...before, comp_plan_expires_at: new Date("2026-11-01T00:00:00.000Z") };
    expect(auditEntries(b, { compPlan: "pro", compPlanExpiresAt: "2026-11-01T00:00:00.000Z" })).toEqual([]);
  });
});
