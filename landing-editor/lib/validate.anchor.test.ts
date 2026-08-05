// landing-editor/lib/validate.anchor.test.ts
// 页内锚点链接：表单要能当主转化路径，CTA 就必须允许指向页内的留资表单。
// 放行范围严格限定在锚点本身——交易语义与非法格式的既有拦截一律不放松。
import { describe, it, expect } from "vitest";
import { validateLink, collectFieldIssues } from "./validate";
import type { LandingPageDraft } from "@/types/schema.draft";

import { getAdminDictionary } from "@/lib/i18n/admin";

// 这些断言认的是中文文案子串，故显式钉中文字典，不依赖 defaultLocale——
// 后者是英文，且以后可能再变；测试要的是确定性，不是跟着默认值漂。
const zh = getAdminDictionary("zh").editor.issues;

describe("validateLink 页内锚点", () => {
  it("放行指向留资表单的锚点", () => {
    expect(validateLink("#lead-form", zh)).toBeUndefined();
  });

  it("放行其它页内锚点（区块跳转）", () => {
    expect(validateLink("#pricing-section", zh)).toBeUndefined();
  });

  it("孤立的 # 不算有效落点", () => {
    expect(validateLink("#", zh)).toBeDefined();
  });

  it("锚点里带交易语义仍然拦截", () => {
    expect(validateLink("#checkout", zh)).toBeDefined();
    expect(validateLink("#add-to-cart", zh)).toBeDefined();
  });

  it("既有规则不受影响：合法 scheme 放行、非法格式仍拦", () => {
    expect(validateLink("https://wa.me/8613800138000", zh)).toBeUndefined();
    expect(validateLink("mailto:sales@example.com", zh)).toBeUndefined();
    expect(validateLink("javascript:alert(1, zh)")).toBeDefined();
    expect(validateLink("wa.me/86138", zh)).toBeDefined();
  });
});

// textByChannel 的键是渠道名不是字段名。按键名工作的校验器会把 email 当成邮箱地址
// 校验，而它其实是按钮文案（"Email Us"）——这是同一失效模式的第四次出现，
// 前三次见 docs/lead-capture-channels.md「改 schema 字段名时必读」。
describe("按渠道键的容器不走字段校验", () => {
  const draft = (textByChannel: Record<string, string>) =>
    ({
      contact: { primary: "whatsapp", whatsapp: "+8613800138000" },
      hero: { title: "T", cta: { text: "Chat Now", textByChannel, target: { kind: "primary" } } },
      sections: [],
      footer: { brandName: "B", copyrightYear: "2026", privacyPolicy: "p", termsOfService: "t" },
    }) as unknown as LandingPageDraft;

  it("textByChannel.email 是按钮文案，不按邮箱格式校验", () => {
    expect(collectFieldIssues(draft({ email: "Email Us", phone: "Call Now" }), zh)).toEqual([]);
  });

  it("contact.email 仍照常按邮箱校验——只跳过按渠道键的容器", () => {
    const d = draft({ email: "Email Us" });
    d.contact.email = "not-an-email";
    expect(collectFieldIssues(d, zh).some((m) => m.includes("邮箱"))).toBe(true);
  });
});
