import { describe, it, expect } from "vitest";
import { collectContactIssues, blankPlaceholderContacts } from "./contactIssues";
import type { LandingPageDraft } from "@/types/schema.draft";

const draft = (heroLink: string, extra: Record<string, unknown> = {}) =>
  ({ hero: { cta: { link: heroLink } }, sections: [], ...extra } as unknown as LandingPageDraft);

describe("collectContactIssues", () => {
  it("首屏 CTA 为真实号码、无占位 → 无问题", () => {
    expect(collectContactIssues(draft("https://wa.me/8613800138000"))).toEqual([]);
  });

  it("含模板占位号 15551234567 → 报占位问题", () => {
    const r = collectContactIssues(draft("https://wa.me/15551234567?text=Hi"));
    expect(r.some((m) => m.includes("占位"))).toBe(true);
  });

  it("其他通道用同一占位号（tel:）也检出", () => {
    const r = collectContactIssues(draft("tel:+15557654321"));
    expect(r.some((m) => m.includes("占位"))).toBe(true);
  });

  it("占位号出现在悬浮按钮等任意位置也检出", () => {
    const d = draft("https://wa.me/8613800138000", { floatingButton: { link: "https://wa.me/15553219876" } });
    expect(collectContactIssues(d).some((m) => m.includes("占位"))).toBe(true);
  });

  it("首屏 CTA 链接为空 → 报空链接问题", () => {
    const r = collectContactIssues(draft("  "));
    expect(r.some((m) => m.includes("为空"))).toBe(true);
  });

  it("首屏 CTA 缺失也当作空", () => {
    const d = { hero: {}, sections: [] } as unknown as LandingPageDraft;
    expect(collectContactIssues(d).some((m) => m.includes("为空"))).toBe(true);
  });
});

describe("blankPlaceholderContacts", () => {
  it("含占位号的 link 置空，真实链接与非 link 字段不动", () => {
    const d = {
      hero: { cta: { text: "Chat", link: "https://wa.me/15551234567?text=Hi" }, secondaryCta: { link: "https://instagram.com/brand" } },
      floatingButton: { link: "https://wa.me/15553219876" },
      footer: { contactEmail: "a@b.com" },
      sections: [],
    } as unknown as LandingPageDraft;
    const out = blankPlaceholderContacts(d) as unknown as {
      hero: { cta: { text: string; link: string }; secondaryCta: { link: string } };
      floatingButton: { link: string };
      footer: { contactEmail: string };
    };
    expect(out.hero.cta.link).toBe("");
    expect(out.floatingButton.link).toBe("");
    expect(out.hero.secondaryCta.link).toBe("https://instagram.com/brand");
    expect(out.hero.cta.text).toBe("Chat");
    expect(out.footer.contactEmail).toBe("a@b.com");
  });

  it("不改动原对象（深拷贝）", () => {
    const d = { hero: { cta: { link: "https://wa.me/15551234567" } }, sections: [] } as unknown as LandingPageDraft;
    blankPlaceholderContacts(d);
    expect((d as unknown as { hero: { cta: { link: string } } }).hero.cta.link).toBe("https://wa.me/15551234567");
  });

  it("无占位号的草稿原样返回（内容相等）", () => {
    const d = { hero: { cta: { link: "https://wa.me/8613800138000" } }, sections: [] } as unknown as LandingPageDraft;
    expect(blankPlaceholderContacts(d)).toEqual(d);
  });
});
