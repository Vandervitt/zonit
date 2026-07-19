import { describe, it, expect } from "vitest";
import { activeCompPlan } from "@/lib/plans";

const now = new Date("2026-07-20T12:00:00Z");
const future = "2026-08-20T12:00:00Z";
const past = "2026-07-01T12:00:00Z";

describe("activeCompPlan（赠送套餐有效性）", () => {
  it("无赠送 → null", () => {
    expect(activeCompPlan(null, future, now)).toBeNull();
    expect(activeCompPlan(undefined, future, now)).toBeNull();
  });
  it("有赠送 + 无到期（永久）→ 返回该档", () => {
    expect(activeCompPlan("pro", null, now)).toBe("pro");
    expect(activeCompPlan("pro", undefined, now)).toBe("pro");
  });
  it("有赠送 + 到期在将来 → 返回该档", () => {
    expect(activeCompPlan("agency", future, now)).toBe("agency");
  });
  it("有赠送 + 已过期 → null", () => {
    expect(activeCompPlan("agency", past, now)).toBeNull();
  });
  it("到期时刻正好等于 now → 视为已过期 → null", () => {
    expect(activeCompPlan("pro", now, now)).toBeNull();
  });
  it("接受 Date 类型的到期时间", () => {
    expect(activeCompPlan("pro", new Date(future), now)).toBe("pro");
    expect(activeCompPlan("pro", new Date(past), now)).toBeNull();
  });
});
