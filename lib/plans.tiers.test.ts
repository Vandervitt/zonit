import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, PAID_FIRST_PLAN_ORDER, planPriceText, yearlySavedMonths } from "./plans";
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

  it("付费档的月付 / 年付价都来自快照", () => {
    for (const id of ["pro", "agency"] as const) {
      expect(PLANS[id].prices.month).toBe(snapshot.plans[id].month / 100);
      expect(PLANS[id].prices.year).toBe(snapshot.plans[id].year / 100);
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

describe("yearlySavedMonths（切换按钮上的「年付省 N 个月」）", () => {
  const plan = (month: number, year: number) => ({ ...PLANS.pro, priceAmount: month, prices: { month, year } });

  it("按实际价格算：年付价恰好是 N 个月月费时，省 12 - N 个月", () => {
    expect(yearlySavedMonths([plan(39, 390), plan(149, 1490)])).toBe(2);
    expect(yearlySavedMonths([plan(39, 351)])).toBe(3);
  });

  it("各档节省月数不一致、不是整月、或年付不便宜时返回 null（按钮不显示这句，避免说假话）", () => {
    expect(yearlySavedMonths([plan(39, 390), plan(149, 1341)])).toBeNull();
    expect(yearlySavedMonths([plan(39, 400)])).toBeNull();
    expect(yearlySavedMonths([plan(39, 468)])).toBeNull();
    expect(yearlySavedMonths([])).toBeNull();
  });
});

describe("PAID_FIRST_PLAN_ORDER（后台计费页的展示顺序）", () => {
  it("付费档在前、Free 置后，且档位集合与 PLAN_ORDER 相同；官网仍用 PLAN_ORDER", () => {
    expect(PAID_FIRST_PLAN_ORDER).toEqual(["pro", "agency", "free"]);
    expect([...PAID_FIRST_PLAN_ORDER].sort()).toEqual([...PLAN_ORDER].sort());
    expect(PLAN_ORDER[0]).toBe("free");
  });
});
