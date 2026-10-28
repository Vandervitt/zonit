import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, planPriceText, YEARLY_PRICE_MONTHS } from "./plans";
import snapshot from "./pricing/prices.json";

describe("档位精简为 Free / Pro / Agency（2026-10-28）", () => {
  it("不再有 Starter 档", () => {
    expect(PLAN_ORDER).toEqual(["free", "pro", "agency"]);
    expect(Object.keys(PLANS).sort()).toEqual(["agency", "free", "pro"]);
  });

  it("Agency 的域名额度是 25 个，不再是不限", () => {
    expect(PLANS.agency.domainsLimit).toBe(25);
    expect(PLANS.agency.landingPagesLimit).toBe(Infinity);
  });

  it("付费档的年付价都来自快照，且等于月费 × 10", () => {
    for (const id of ["pro", "agency"] as const) {
      expect(PLANS[id].prices.month).toBe(snapshot.plans[id].month / 100);
      expect(PLANS[id].prices.year).toBe(snapshot.plans[id].year / 100);
      expect(Math.round(PLANS[id].prices.year * 100)).toBe(Math.round(PLANS[id].prices.month * 100) * YEARLY_PRICE_MONTHS);
    }
    expect(PLANS.free.prices).toEqual({ month: 0, year: 0 });
  });
});

describe("planPriceText 年付", () => {
  const PRO = { ...PLANS.pro, prices: { month: 39, year: 390 }, priceAmount: 39 };

  it("年付：金额为年价、后缀为每年，附折合月价与节省额（折合月价向下截断到分）", () => {
    const zh = planPriceText(PRO, "zh", null, "year");
    expect(zh.amount).toBe("$390");
    expect(zh.suffix).toBe("/年");
    // 390 / 12 = 32.5
    expect(zh.yearlyNote).toBe("相当于 $32.50/月 · 省 $78");
    const en = planPriceText({ ...PRO, prices: { month: 149, year: 1490 } }, "en", null, "year");
    expect(en.amount).toBe("$1,490");
    // 1490 / 12 = 124.1666… → 截断为 124.16（不四舍五入成 124.17）
    expect(en.yearlyNote).toBe("$124.16/mo billed yearly · save $298");
  });

  it("月付不出年付说明；Free 两种周期都显示免费", () => {
    expect(planPriceText(PRO, "zh", null, "month").yearlyNote).toBeNull();
    expect(planPriceText(PLANS.free, "zh", null, "year")).toMatchObject({ amount: "免费", suffix: "", yearlyNote: null });
  });

  it("年付时人民币参考换算按年价算", () => {
    expect(planPriceText(PRO, "zh", 7.1, "year").approx).toBe("约 ¥2,769"); // 390 × 7.1 = 2769，带千分位
  });
});
