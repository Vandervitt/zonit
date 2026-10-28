import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, planComparisonLayout, planFeatureRows } from "./plans";
import { plans as enPlans } from "./i18n/dictionaries/en/plans";

describe("planComparisonLayout", () => {
  const layout = planComparisonLayout(enPlans, "en");
  const keysIn = (rows: { key: string }[]) => rows.map((r) => r.key);

  it("四档全有的布尔权益收进「所有套餐都包含」，不占对比行", () => {
    expect(keysIn(layout.common)).toEqual(["templates", "editor", "basicPixel"]);
    for (const row of layout.common) {
      expect(PLAN_ORDER.every((p) => row.valueFor(PLANS[p]) === true)).toBe(true);
    }
  });

  it("其余每一行恰好出现在一个分组里，不丢不重", () => {
    const grouped = layout.groups.flatMap((g) => keysIn(g.rows));
    const all = keysIn(planFeatureRows(enPlans, "en"));
    expect([...grouped, ...keysIn(layout.common)].sort()).toEqual([...all].sort());
    expect(new Set(grouped).size).toBe(grouped.length);
  });

  it("分组按用户关心的顺序排列，且没有空组", () => {
    expect(layout.groups.map((g) => g.id)).toEqual(["publish", "tracking", "ai", "scale"]);
    expect(layout.groups.every((g) => g.rows.length > 0)).toBe(true);
    expect(keysIn(layout.groups[0].rows)).toEqual(["landingPages", "customDomain", "watermark"]);
  });
});
