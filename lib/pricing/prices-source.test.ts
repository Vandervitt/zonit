// 守卫：所有展示价必须派生自构建期 Dodo 定价快照（prices.json），不得在代码里重新手写数字。
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, it, expect } from "vitest";
import { PLANS, PLAN_ORDER, planPriceLabel } from "@/lib/plans";
import { CREDIT_PACKS } from "@/lib/credits";
import { billing as enBilling } from "@/app/admin/(workspace)/help/_content/chapters/en/billing";
import { billing as zhBilling } from "@/app/admin/(workspace)/help/_content/chapters/zh/billing";
import snapshot from "./prices.json";

const read = (rel: string) => readFileSync(path.join(process.cwd(), rel), "utf8");

describe("展示价来源", () => {
  it("付费档月费等于快照（美分 → 美元），Free 固定为 0", () => {
    expect(PLANS.free.priceAmount).toBe(0);
    expect(PLANS.starter.priceAmount).toBe(snapshot.plans.starter / 100);
    expect(PLANS.pro.priceAmount).toBe(snapshot.plans.pro / 100);
    expect(PLANS.agency.priceAmount).toBe(snapshot.plans.agency / 100);
  });

  it("充值包价格等于快照", () => {
    const byCredits = Object.fromEntries(CREDIT_PACKS.map((p) => [String(p.credits), p.priceUsd]));
    expect(byCredits).toEqual({ "50": snapshot.credits["50"] / 100, "200": snapshot.credits["200"] / 100 });
  });

  it("帮助中心对比表表头的价格由 PLANS 派生", () => {
    const enHead = enBilling.sections[0].blocks.find((b) => b.t === "table");
    const zhHead = zhBilling.sections[0].blocks.find((b) => b.t === "table");
    expect(enHead && "head" in enHead && enHead.head.slice(1)).toEqual(
      PLAN_ORDER.map((id) => `${PLANS[id].label} (${planPriceLabel(PLANS[id], "en")})`),
    );
    expect(zhHead && "head" in zhHead && zhHead.head.slice(1)).toEqual(
      PLAN_ORDER.map((id) => `${PLANS[id].label}（${planPriceLabel(PLANS[id], "zh")}）`),
    );
  });

  it("源码里不再手写付费档 / 充值包价格", () => {
    expect(read("lib/plans.ts")).not.toMatch(/priceAmount:\s*[1-9]/);
    expect(read("lib/credits.ts")).not.toMatch(/priceUsd:\s*\d/);
    for (const loc of ["en", "zh"]) {
      expect(read(`app/admin/(workspace)/help/_content/chapters/${loc}/billing.ts`)).not.toMatch(/\$\d+\.\d{2}/);
    }
  });
});
