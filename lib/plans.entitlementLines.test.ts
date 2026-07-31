import { describe, it, expect } from "vitest";
import { planEntitlementLines, PLANS } from "./plans";

const keysOf = (plan: Parameters<typeof planEntitlementLines>[0]) =>
  planEntitlementLines(plan).map((l) => l.key);

describe("planEntitlementLines", () => {
  it("剔除该档没有的布尔权益", () => {
    // free 有水印、无高级追踪/反同质化/webhook
    const free = keysOf("free");
    expect(free).not.toContain("watermark");
    expect(free).not.toContain("advancedTracking");
    expect(free).not.toContain("antiBan");
    expect(free).not.toContain("leadWebhook");
  });

  it("Free 也有发布地址（平台子域），不该从权益清单里消失", () => {
    // 平台子域（PR #145）上线前，Free 的 domainsLimit 是 0 → 值为「—」→ 被剔除。
    // 现在它虽无自有域名槽位，却能发布到平台分配的地址，这是它真实拥有的权益，
    // 邮件里的套餐权益清单必须体现，否则免费用户会以为自己发不出页面。
    expect(keysOf("free")).toContain("customDomain");
    expect(keysOf("starter")).toContain("customDomain");
  });

  it("布尔为假的行仍被剔除（剔除机制本身未失效）", () => {
    // 上一条改了额度型的表现，这条守住剔除机制：Free 没有的能力不得出现。
    const free = keysOf("free");
    expect(free).not.toContain("watermark");
    expect(free).not.toContain("advancedTracking");
  });

  it("Pro 含去水印、高级追踪与 webhook，但不含反同质化", () => {
    const pro = keysOf("pro");
    expect(pro).toContain("watermark");
    expect(pro).toContain("advancedTracking");
    expect(pro).toContain("leadWebhook");
    expect(pro).not.toContain("antiBan");
  });

  it("Agency 含反同质化", () => {
    expect(keysOf("agency")).toContain("antiBan");
  });

  it("额度型权益带值，有无型权益值为 null", () => {
    const lines = planEntitlementLines("pro");
    expect(lines.find((l) => l.key === "landingPages")?.value).toBe("20 张");
    expect(lines.find((l) => l.key === "customDomain")?.value).toBe("5 个");
    expect(lines.find((l) => l.key === "watermark")?.value).toBeNull();
  });

  it("Infinity 额度渲染为「无限」而非 Infinity", () => {
    const lines = planEntitlementLines("agency");
    expect(lines.find((l) => l.key === "landingPages")?.value).toBe("无限");
    expect(lines.find((l) => l.key === "aiRewrite")?.value).toBe("无限");
  });

  it("AI 额度取自 PLANS，不写死——改配置即改产出", () => {
    const lines = planEntitlementLines("pro");
    expect(lines.find((l) => l.key === "aiPage")?.value).toBe(`${PLANS.pro.aiPageQuota} 次/月`);
  });

  it("档位越高权益条目不减少（单调性）", () => {
    const counts = (["free", "starter", "pro", "agency"] as const).map(
      (p) => planEntitlementLines(p).length,
    );
    for (let i = 1; i < counts.length; i++) {
      expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    }
  });

  it("每档都至少含模板与编辑器（全档共有）", () => {
    for (const p of ["free", "starter", "pro", "agency"] as const) {
      expect(keysOf(p)).toEqual(expect.arrayContaining(["templates", "editor"]));
    }
  });
});
