import { describe, it, expect } from "vitest";
import { summarizeCapiHealth, explainCapiError, type CapiProviderHealth } from "./health";

const row = (over: Partial<CapiProviderHealth>): CapiProviderHealth => ({
  provider: "meta", sent: 0, pending: 0, failed: 0, lastError: null, lastErrorAt: null, ...over,
});

describe("summarizeCapiHealth", () => {
  it("完全没有回传记录 → idle（没配、没线索或套餐不含，不是故障）", () => {
    expect(summarizeCapiHealth([]).verdict).toBe("idle");
    expect(summarizeCapiHealth([row({})]).verdict).toBe("idle");
  });

  it("全部送达 → healthy，送达率 100%", () => {
    const s = summarizeCapiHealth([row({ sent: 40 })]);
    expect(s.verdict).toBe("healthy");
    expect(s.deliveryRate).toBe(1);
  });

  it("有失败但多数送达 → degraded", () => {
    expect(summarizeCapiHealth([row({ sent: 90, failed: 10 })]).verdict).toBe("degraded");
  });

  it("失败过半 → failing（基本等于凭据或配置有问题）", () => {
    expect(summarizeCapiHealth([row({ sent: 4, failed: 6 })]).verdict).toBe("failing");
  });

  it("重试中的事件不计入送达率分母——它还没定局", () => {
    const s = summarizeCapiHealth([row({ sent: 10, pending: 90 })]);
    expect(s.deliveryRate).toBe(1);
    expect(s.verdict).toBe("healthy");
    expect(s.pending).toBe(90);
  });

  it("多 provider 汇总相加", () => {
    const s = summarizeCapiHealth([row({ sent: 5 }), row({ provider: "tiktok", sent: 3, failed: 2 })]);
    expect({ sent: s.sent, failed: s.failed }).toEqual({ sent: 8, failed: 2 });
  });
});

describe("explainCapiError", () => {
  // 只回原因键，文案在字典（分析页按界面语言展示）——这样这条断言也不再随文案改动而碎。
  it("把平台原始报错归到可动手修的原因", () => {
    expect(explainCapiError("missing_credential")).toBe("missingCredential");
    expect(explainCapiError("OAuthException: Invalid OAuth access token")).toBe("invalidToken");
    expect(explainCapiError("(#200) Permissions error")).toBe("insufficientScope");
    expect(explainCapiError("429 Too Many Requests")).toBe("rateLimited");
    expect(explainCapiError("404 dataset not found")).toBe("wrongDataset");
  });

  it("每个原因键在两种语言里都有文案", async () => {
    const { getAdminDictionary } = await import("@/lib/i18n/admin");
    const keys = ["missingCredential", "invalidToken", "insufficientScope", "wrongDataset", "rateLimited"] as const;
    for (const locale of ["en", "zh"] as const) {
      const reasons = getAdminDictionary(locale).analytics.capiHealth.reasons;
      for (const k of keys) expect(reasons[k], `${locale}.${k}`).toBeTruthy();
    }
  });

  it("认不出的报错返回 null——由 UI 原样展示平台返回，不编造解释", () => {
    expect(explainCapiError("some unexpected upstream text")).toBeNull();
    expect(explainCapiError(null)).toBeNull();
  });
});
