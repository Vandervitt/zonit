import { describe, it, expect } from "vitest";
import { findBannedTerms, filterCandidates, checkDraftCompliance } from "@/lib/ai/guardrails";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";

describe("findBannedTerms", () => {
  it("命中英文交易词", () => {
    expect(findBannedTerms("Add to cart and checkout now").length).toBeGreaterThan(0);
  });
  it("命中中文交易词", () => {
    expect(findBannedTerms("立即购买，加入购物车").length).toBeGreaterThan(0);
  });
  it("命中价格符号模式", () => {
    expect(findBannedTerms("only $49 today").length).toBeGreaterThan(0);
  });
  it("干净的 lead-gen 文案放行", () => {
    expect(findBannedTerms("免费预约咨询，留下您的 WhatsApp")).toEqual([]);
  });
});

describe("filterCandidates", () => {
  it("剔除含禁词的候选", () => {
    expect(filterCandidates(["免费咨询", "now only $9 buy now"])).toEqual(["免费咨询"]);
  });
});

describe("checkDraftCompliance", () => {
  it("合法模板通过", async () => {
    const r = checkDraftCompliance(await loadTemplateDraft());
    expect(r.ok).toBe(true);
  });
  it("含交易词的 draft 被拒", async () => {
    const bad = structuredClone(await loadTemplateDraft());
    bad.hero.title = "立即购买 buy now";
    const r = checkDraftCompliance(bad);
    expect(r.ok).toBe(false);
    expect(r.reason).toBe("banned_terms");
  });
});
