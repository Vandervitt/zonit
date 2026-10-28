import { describe, it, expect } from "vitest";
import { visitorCtaSpec } from "./PlanComparison";
import { PLAN_ORDER, SIGNUP_TRIAL_DAYS, SIGNUP_TRIAL_PLAN } from "@/lib/plans";
import { Routes } from "@/lib/constants";

describe("visitorCtaSpec（营销站访客的套餐按钮）", () => {
  it.each(["en", "zh"] as const)("%s：每一档都去注册页，绝不去后台计费页", (locale) => {
    // 回归：旧版付费档按钮指向 /admin/billing，未登录访客点了只会落到登录页，
    // 而他们根本还没有账号。
    for (const planId of PLAN_ORDER) {
      const { href } = visitorCtaSpec(locale, planId);
      expect(href, planId).not.toBe(Routes.Billing);
      expect(href, planId).toMatch(/\/register$/);
    }
  });

  it("只有注册试用档是主按钮，且文案带真实试用天数", () => {
    const primaries = PLAN_ORDER.filter((id) => visitorCtaSpec("zh", id).primary);
    expect(primaries).toEqual([SIGNUP_TRIAL_PLAN]);
    expect(visitorCtaSpec("zh", SIGNUP_TRIAL_PLAN).label).toBe(`免费试用 ${SIGNUP_TRIAL_DAYS} 天`);
    // 英文按钮不带天数：窄列里放不下，天数已在该列徽标里。
    expect(visitorCtaSpec("en", SIGNUP_TRIAL_PLAN).label).toBe("Start free trial");
  });
});
