import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, planFeatureRows, formatPlanLimit, planPriceText } from "./plans";
import { getDictionary } from "./i18n/dictionaries";

describe("formatPlanLimit", () => {
  it("Infinity 按语言输出不限", () => {
    expect(formatPlanLimit(Infinity, "en", "pages")).toBe("Unlimited");
    expect(formatPlanLimit(Infinity, "zh", "pages")).toBe("无限");
  });

  it("0 输出破折号，与语言无关", () => {
    expect(formatPlanLimit(0, "en", "domains")).toBe("—");
    expect(formatPlanLimit(0, "zh", "domains")).toBe("—");
  });

  it("有限值带本地化量词", () => {
    expect(formatPlanLimit(3, "en", "pages")).toBe("3 pages");
    expect(formatPlanLimit(3, "zh", "pages")).toBe("3 张");
    expect(formatPlanLimit(80, "en", "perMonth")).toBe("80 / mo");
    expect(formatPlanLimit(80, "zh", "perMonth")).toBe("80 次/月");
  });
});

describe("planPriceText", () => {
  it("free 档显示免费文案，不显示金额", () => {
    expect(planPriceText(PLANS.free, "en")).toEqual({ amount: "Free", suffix: "" });
    expect(planPriceText(PLANS.free, "zh")).toEqual({ amount: "免费", suffix: "" });
  });

  it("付费档保留货币与金额，仅后缀本地化", () => {
    expect(planPriceText(PLANS.pro, "en")).toEqual({ amount: "CN¥79.99", suffix: "/mo" });
    expect(planPriceText(PLANS.pro, "zh")).toEqual({ amount: "CN¥79.99", suffix: "/月" });
  });
});

describe("planFeatureRows", () => {
  it("两种语言行数一致、结构一致", () => {
    const rowsEn = planFeatureRows(getDictionary("en").plans);
    const rowsZh = planFeatureRows(getDictionary("zh").plans);
    expect(rowsEn.length).toBe(rowsZh.length);
    expect(rowsEn.length).toBeGreaterThan(0);
    expect(rowsEn.map((r) => r.key)).toEqual(rowsZh.map((r) => r.key));
  });

  it("布尔型权益的取值不随语言变化（只有文案变，逻辑不变）", () => {
    const rowsEn = planFeatureRows(getDictionary("en").plans, "en");
    const rowsZh = planFeatureRows(getDictionary("zh").plans, "zh");
    for (const planId of PLAN_ORDER) {
      rowsEn.forEach((row, i) => {
        const a = row.valueFor(PLANS[planId]);
        const b = rowsZh[i].valueFor(PLANS[planId]);
        if (typeof a === "boolean") expect(b).toBe(a);
      });
    }
  });

  it("反同质化行仅 agency 为真——权益门控不能被 i18n 改动破坏", () => {
    const rows = planFeatureRows(getDictionary("en").plans);
    const antiBanRow = rows.find((r) => r.key === "antiBan");
    expect(antiBanRow).toBeDefined();
    expect(antiBanRow!.valueFor(PLANS.agency)).toBe(true);
    expect(antiBanRow!.valueFor(PLANS.pro)).toBe(false);
    expect(antiBanRow!.valueFor(PLANS.free)).toBe(false);
  });

  it("落地页数量行按语言输出对应量词", () => {
    const en = planFeatureRows(getDictionary("en").plans, "en").find((r) => r.key === "landingPages");
    const zh = planFeatureRows(getDictionary("zh").plans, "zh").find((r) => r.key === "landingPages");
    expect(en!.valueFor(PLANS.starter)).toBe("3 pages");
    expect(zh!.valueFor(PLANS.starter)).toBe("3 张");
    expect(en!.valueFor(PLANS.agency)).toBe("Unlimited");
    expect(zh!.valueFor(PLANS.agency)).toBe("无限");
  });

  it("每档 highlights 两种语言条数一致", () => {
    const en = getDictionary("en").plans;
    const zh = getDictionary("zh").plans;
    for (const planId of PLAN_ORDER) {
      expect(en.highlights[planId].length).toBe(zh.highlights[planId].length);
    }
  });
});
