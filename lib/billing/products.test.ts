import { describe, it, expect } from "vitest";
import { planProductMap, productFor, type PlanProductIds } from "./products";

const ids: PlanProductIds = {
  pro: { month: "p_m", year: "p_y" },
  agency: { month: "a_m", year: undefined },
};

describe("订阅产品 ↔ (档位, 周期)", () => {
  it("按 (档位, 周期) 取产品 id；未配置的返回 undefined", () => {
    expect(productFor(ids, "pro", "year")).toBe("p_y");
    expect(productFor(ids, "agency", "month")).toBe("a_m");
    expect(productFor(ids, "agency", "year")).toBeUndefined();
  });

  it("反查表只含已配置的产品，且与 productFor 互逆", () => {
    const map = planProductMap(ids);
    expect(map).toEqual({
      p_m: { plan: "pro", interval: "month" },
      p_y: { plan: "pro", interval: "year" },
      a_m: { plan: "agency", interval: "month" },
    });
    for (const [productId, { plan, interval }] of Object.entries(map)) {
      expect(productFor(ids, plan, interval)).toBe(productId);
    }
  });
});
