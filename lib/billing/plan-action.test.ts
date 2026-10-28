import { describe, it, expect } from "vitest";
import { planAction } from "./plan-action";

describe("planAction（后台计费页每档按钮的动作）", () => {
  it("Free 档永远不放按钮（取消订阅走客户门户）", () => {
    expect(planAction({ plan: "pro", interval: "month" }, "free", "month")).toBe("none");
    expect(planAction({ plan: "free", interval: null }, "free", "year")).toBe("none");
  });

  it("免费用户：任一付费档都是升级（走结账）", () => {
    expect(planAction({ plan: "free", interval: null }, "pro", "year")).toBe("upgrade");
    expect(planAction({ plan: "free", interval: null }, "agency", "month")).toBe("upgrade");
  });

  it("同档同周期 = 当前套餐，不放按钮", () => {
    expect(planAction({ plan: "pro", interval: "year" }, "pro", "year")).toBe("none");
  });

  it("同档不同周期 = 切换周期", () => {
    expect(planAction({ plan: "pro", interval: "month" }, "pro", "year")).toBe("switchInterval");
    expect(planAction({ plan: "agency", interval: "year" }, "agency", "month")).toBe("switchInterval");
  });

  it("跨档按档位高低判定升 / 降，与所选周期无关", () => {
    expect(planAction({ plan: "pro", interval: "year" }, "agency", "month")).toBe("upgrade");
    expect(planAction({ plan: "agency", interval: "month" }, "pro", "year")).toBe("downgrade");
  });

  it("旧订阅没记录周期时按月付处理", () => {
    expect(planAction({ plan: "pro", interval: null }, "pro", "month")).toBe("none");
    expect(planAction({ plan: "pro", interval: null }, "pro", "year")).toBe("switchInterval");
  });
});
