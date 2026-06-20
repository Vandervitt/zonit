import { describe, it, expect } from "vitest";
import { PLANS } from "@/lib/plans";

describe("PLANS AI 额度", () => {
  it("各套餐整页/改写额度符合 spec", () => {
    expect(PLANS.free.aiPageQuota).toBe(3);
    expect(PLANS.free.aiRewriteQuota).toBe(10);
    expect(PLANS.starter.aiPageQuota).toBe(15);
    expect(PLANS.starter.aiRewriteQuota).toBe(100);
    expect(PLANS.pro.aiPageQuota).toBe(80);
    expect(PLANS.pro.aiRewriteQuota).toBe(Infinity);
    expect(PLANS.agency.aiPageQuota).toBe(300);
    expect(PLANS.agency.aiRewriteQuota).toBe(Infinity);
  });
});
