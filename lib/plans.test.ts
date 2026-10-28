import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER } from "@/lib/plans";

describe("PLANS AI 额度", () => {
  it("各套餐整页/改写额度符合 spec", () => {
    expect(PLANS.free.aiPageQuota).toBe(3);
    expect(PLANS.free.aiRewriteQuota).toBe(10);
    expect(PLANS.pro.aiPageQuota).toBe(80);
    expect(PLANS.pro.aiRewriteQuota).toBe(Infinity);
    expect(PLANS.agency.aiPageQuota).toBe(300);
    expect(PLANS.agency.aiRewriteQuota).toBe(Infinity);
  });
});

describe("PLANS 水印", () => {
  it("水印只留给 Free：付费档挂的是客户自己的品牌域名，不该再带平台水印", () => {
    expect(PLAN_ORDER.filter((id) => PLANS[id].hasWatermark)).toEqual(["free"]);
  });
});
