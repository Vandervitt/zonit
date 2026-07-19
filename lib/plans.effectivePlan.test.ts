import { describe, it, expect } from "vitest";
import { effectivePlan } from "@/lib/plans";

describe("effectivePlan（生效套餐 = max(plan, comp_plan)）", () => {
  it("无赠送时返回付费套餐", () => {
    expect(effectivePlan("free", null)).toBe("free");
    expect(effectivePlan("pro", null)).toBe("pro");
    expect(effectivePlan("pro", undefined)).toBe("pro");
  });
  it("赠送高于付费时取赠送档", () => {
    expect(effectivePlan("free", "pro")).toBe("pro");
    expect(effectivePlan("starter", "agency")).toBe("agency");
  });
  it("付费高于或等于赠送时取付费档（LS 覆写 plan 不影响赠送语义）", () => {
    expect(effectivePlan("agency", "starter")).toBe("agency");
    expect(effectivePlan("pro", "pro")).toBe("pro");
  });
});
