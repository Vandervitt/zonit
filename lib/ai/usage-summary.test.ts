import { describe, it, expect } from "vitest";
import { buildUsageSummary } from "./usage-summary";

describe("buildUsageSummary", () => {
  it("映射套餐上限与已用量、credit 余额", () => {
    const s = buildUsageSummary({
      plan: "free",
      pageUsed: 2,
      rewriteUsed: 5,
      creditBalance: 3,
    });
    expect(s.page).toEqual({ used: 2, limit: 3 });
    expect(s.rewrite).toEqual({ used: 5, limit: 10 });
    expect(s.creditBalance).toBe(3);
  });

  it("Infinity 上限用 null 表示不限", () => {
    const s = buildUsageSummary({
      plan: "pro",
      pageUsed: 10,
      rewriteUsed: 0,
      creditBalance: 0,
    });
    expect(s.rewrite.limit).toBeNull(); // pro 的 aiRewriteQuota = Infinity
  });
});
