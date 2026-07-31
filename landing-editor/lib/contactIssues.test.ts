import { describe, it, expect } from "vitest";
import { collectContactIssues, collectContactIssueItems, blankPrimaryCtaLinks } from "./contactIssues";
import type { LandingPageDraft } from "@/types/schema.draft";

const draft = (heroLink: string, extra: Record<string, unknown> = {}) =>
  ({ hero: { cta: { text: "Go", link: heroLink } }, sections: [], ...extra } as unknown as LandingPageDraft);

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

  it("悬浮按钮存在但链接为空 → 报空链接问题，target 指向 floatingButton", () => {
    const d = draft("https://wa.me/8613800138000", { floatingButton: { text: "Chat", link: "  " } });
    const hit = collectContactIssueItems(d).find((i) => i.message.includes("悬浮按钮链接为空"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "floatingButton" });
  });

  it("无悬浮按钮 → 不报悬浮相关问题", () => {
    const r = collectContactIssues(draft("https://wa.me/8613800138000"));
    expect(r.some((m) => m.includes("悬浮"))).toBe(false);
  });

  it("悬浮按钮链接已填且非占位 → 无问题", () => {
    const d = draft("https://wa.me/8613800138000", { floatingButton: { text: "Chat", link: "https://t.me/brand" } });
    expect(collectContactIssues(d)).toEqual([]);
  });

  it("首屏 CTA 文案为空 → 报文案问题，target 指向 hero", () => {
    const d = { hero: { cta: { text: "  ", link: "https://wa.me/8613800138000" } }, sections: [] } as unknown as LandingPageDraft;
    const hit = collectContactIssueItems(d).find((i) => i.message.includes("首屏 CTA 按钮文案为空"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "hero" });
  });

  it("悬浮按钮文案为空（链接已填）→ 报文案问题", () => {
    const d = draft("https://wa.me/8613800138000", { floatingButton: { text: "", link: "https://t.me/brand" } });
    const hit = collectContactIssueItems(d).find((i) => i.message.includes("悬浮按钮文案为空"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "floatingButton" });
  });
});

describe("blankPrimaryCtaLinks", () => {
  it("置空首屏主 CTA 与悬浮按钮（渠道无关，不看具体值）；二级/社交/文案不动", () => {
    const d = {
      hero: { cta: { text: "Chat", link: "https://wa.me/15551234567?text=Hi" }, secondaryCta: { link: "https://instagram.com/brand" } },
      floatingButton: { link: "https://t.me/somebrand" },
      footer: { contactEmail: "a@b.com" },
      sections: [],
    } as unknown as LandingPageDraft;
    const out = blankPrimaryCtaLinks(d) as unknown as {
      hero: { cta: { text: string; link: string }; secondaryCta: { link: string } };
      floatingButton: { link: string };
      footer: { contactEmail: string };
    };
    expect(out.hero.cta.link).toBe("");
    expect(out.floatingButton.link).toBe(""); // Telegram 也照样置空——渠道无关
    expect(out.hero.secondaryCta.link).toBe("https://instagram.com/brand");
    expect(out.hero.cta.text).toBe("Chat");
    expect(out.footer.contactEmail).toBe("a@b.com");
  });

  it("即便主 CTA 是真实链接，模板实例化时也置空（模板默认非用户联系方式）", () => {
    const d = { hero: { cta: { link: "https://wa.me/8613800138000" } }, sections: [] } as unknown as LandingPageDraft;
    expect((blankPrimaryCtaLinks(d) as unknown as { hero: { cta: { link: string } } }).hero.cta.link).toBe("");
  });

  it("不改动原对象（深拷贝）", () => {
    const d = { hero: { cta: { link: "https://wa.me/15551234567" } }, sections: [] } as unknown as LandingPageDraft;
    blankPrimaryCtaLinks(d);
    expect((d as unknown as { hero: { cta: { link: string } } }).hero.cta.link).toBe("https://wa.me/15551234567");
  });

  it("无 floatingButton 时不报错", () => {
    const d = { hero: { cta: { link: "x" } }, sections: [] } as unknown as LandingPageDraft;
    expect(() => blankPrimaryCtaLinks(d)).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 表单作为主转化路径：CTA 指向页内留资表单时，锚点本身就是有效落点，
// 不该被当成"未填联系方式"而挡在发布门槛外，也不该在实例化时被清空。
// ---------------------------------------------------------------------------

const withLeadForm = (heroLink: string, enabled: boolean, extra: Record<string, unknown> = {}) =>
  ({
    hero: { cta: { text: "Get a quote", link: heroLink } },
    sections: [],
    leadForm: { enabled, title: "t", submitText: "s", successMessage: "m", fields: {} },
    ...extra,
  }) as unknown as LandingPageDraft;

describe("表单主转化：锚点 CTA", () => {
  it("CTA 指向已启用的留资表单 → 不报「链接为空」类问题", () => {
    expect(collectContactIssues(withLeadForm("#lead-form", true))).toEqual([]);
  });

  it("CTA 指向锚点但表单未启用 → 报死链问题，target 指向 hero", () => {
    const hit = collectContactIssueItems(withLeadForm("#lead-form", false)).find((i) =>
      i.message.includes("留资表单"),
    );
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "hero" });
  });

  it("CTA 指向锚点但整个页面没有留资表单 → 同样报死链问题", () => {
    const d = draft("#lead-form");
    expect(collectContactIssues(d).some((m) => m.includes("留资表单"))).toBe(true);
  });

  it("悬浮按钮指向锚点同样按此规则校验", () => {
    const ok = withLeadForm("https://wa.me/8613800138000", true, {
      floatingButton: { text: "Quote", link: "#lead-form" },
    });
    expect(collectContactIssues(ok)).toEqual([]);

    const bad = withLeadForm("https://wa.me/8613800138000", false, {
      floatingButton: { text: "Quote", link: "#lead-form" },
    });
    expect(collectContactIssues(bad).some((m) => m.includes("留资表单"))).toBe(true);
  });

  it("实例化时锚点链接不被清空——它不是用户的联系方式，无需重填", () => {
    const d = {
      hero: { cta: { text: "Get a quote", link: "#lead-form" } },
      floatingButton: { text: "Quote", link: "#lead-form" },
      sections: [],
    } as unknown as LandingPageDraft;
    const out = blankPrimaryCtaLinks(d) as unknown as {
      hero: { cta: { link: string } };
      floatingButton: { link: string };
    };
    expect(out.hero.cta.link).toBe("#lead-form");
    expect(out.floatingButton.link).toBe("#lead-form");
  });

  it("非锚点链接的清空行为不变", () => {
    const d = {
      hero: { cta: { link: "https://wa.me/15551234567" } },
      floatingButton: { link: "#lead-form" },
      sections: [],
    } as unknown as LandingPageDraft;
    const out = blankPrimaryCtaLinks(d) as unknown as {
      hero: { cta: { link: string } };
      floatingButton: { link: string };
    };
    expect(out.hero.cta.link).toBe("");
    expect(out.floatingButton.link).toBe("#lead-form");
  });
});
