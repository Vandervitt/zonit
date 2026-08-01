import { describe, expect, it } from "vitest";
import { convertDraft } from "./convert-draft";
import type { LegacyDraft } from "./cta-inventory";

const base = {
  sections: [],
  footer: { brandName: "B", copyrightYear: "2026", contactEmail: "hi@b.com", privacyPolicy: "/p", termsOfService: "/t" },
};

const draft = (patch: Record<string, unknown>) => ({ ...base, ...patch }) as unknown as LegacyDraft;

describe("convertDraft", () => {
  it("从 hero.cta.link 推断主渠道并收录号码", () => {
    const out = convertDraft(draft({ hero: { cta: { text: "Chat", link: "https://wa.me/8613800138000" } } }));
    expect(out.contact.primary).toBe("whatsapp");
    expect(out.contact.whatsapp).toBe("+8613800138000");
    expect(out.hero.cta.target).toEqual({ kind: "primary" });
  });

  it("footer.contactEmail 收进 contact.email，原字段删除", () => {
    const out = convertDraft(draft({ hero: { cta: { text: "C", link: "#lead-form" } } }));
    expect(out.contact.primary).toBe("form");
    expect(out.contact.email).toBe("hi@b.com");
    expect("contactEmail" in out.footer).toBe(false);
  });

  it("二级外链转成 url 落点", () => {
    const out = convertDraft(draft({
      hero: { cta: { text: "C", link: "#lead-form" }, secondaryCta: { text: "IG", link: "https://instagram.com/b" } },
    }));
    expect(out.hero.secondaryCta?.target).toEqual({ kind: "url", url: "https://instagram.com/b" });
  });

  it("同页第二个不同的 WhatsApp 号不归一，原样保留为 url", () => {
    const out = convertDraft(draft({
      hero: { cta: { text: "C", link: "https://wa.me/8613800138000" } },
      floatingButton: { text: "F", link: "https://wa.me/8618900000000" },
    }));
    expect(out.contact.whatsapp).toBe("+8613800138000");
    expect(out.floatingButton?.target).toEqual({ kind: "url", url: "https://wa.me/8618900000000" });
  });

  it("同一个号码的第二处落点转成引用", () => {
    const out = convertDraft(draft({
      hero: { cta: { text: "C", link: "https://wa.me/8613800138000" } },
      floatingButton: { text: "F", link: "https://wa.me/8613800138000" },
    }));
    expect(out.floatingButton?.target).toEqual({ kind: "primary" });
  });

  // blankPrimaryCtaLinks 跳过锚点，故空链接必然原本是深链，绝不可能是表单。
  // 若兜底成 form 会解析出 #lead-form（原本是空），等价性立刻破。
  it("hero.cta.link 为空时兜底为值为空的渠道，绝不兜成 form", () => {
    const out = convertDraft(draft({ hero: { cta: { text: "C", link: "" } }, leadForm: { enabled: true } }));
    expect(out.contact.primary).toBe("whatsapp");
    expect(out.contact.whatsapp).toBeUndefined();
  });

  it("空链接时从残留链接推断渠道类型", () => {
    const out = convertDraft(draft({
      hero: { cta: { text: "C", link: "" } },
      sections: [{ type: "plans", data: { items: [{ cta: { text: "Call", link: "tel:+15551234567" } }] } }],
    }));
    expect(out.contact.primary).toBe("phone");
    expect(out.contact.phone).toBeUndefined();
  });

  it("sections 里的嵌套 CTA 一并转换，link 字段删除", () => {
    const out = convertDraft(draft({
      hero: { cta: { text: "C", link: "https://wa.me/8613800138000" } },
      sections: [{ type: "plans", data: { items: [{ cta: { text: "Buy", link: "https://wa.me/8613800138000" } }] } }],
    }));
    const cta = (out.sections[0] as { data: { items: { cta: Record<string, unknown> }[] } }).data.items[0].cta;
    expect(cta.target).toEqual({ kind: "primary" });
    expect("link" in cta).toBe(false);
  });
});
