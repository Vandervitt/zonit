import { describe, it, expect } from "vitest";
import { collectPlaceholderIssues } from "./placeholderIssues";
import type { LandingPageDraft } from "@/types/schema.draft";

const draftWith = (link: string) =>
  ({ hero: { cta: { link } }, sections: [] } as unknown as LandingPageDraft);

describe("collectPlaceholderIssues", () => {
  it("含模板占位 WhatsApp 号 15551234567 → 报一条问题", () => {
    expect(collectPlaceholderIssues(draftWith("https://wa.me/15551234567?text=Hi")).length).toBe(1);
  });
  it("另一占位号 15557654321 → 报问题", () => {
    expect(collectPlaceholderIssues(draftWith("https://wa.me/15557654321")).length).toBe(1);
  });
  it("真实号码 → 无问题", () => {
    expect(collectPlaceholderIssues(draftWith("https://wa.me/8613800138000"))).toEqual([]);
  });
  it("占位号出现在任意位置（如悬浮按钮）也能检出", () => {
    const d = { floatingButton: { link: "https://wa.me/15553219876" }, sections: [] } as unknown as LandingPageDraft;
    expect(collectPlaceholderIssues(d).length).toBe(1);
  });
});
