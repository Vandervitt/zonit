// 发布门槛的联系方式校验。改造后号码只存在 contact 一处，故断言从「链接是否为空」
// 变成「引用的渠道有没有值」——意图不变：访客点了 CTA 必须能联系到人。
import { describe, it, expect } from "vitest";
import { collectContactIssues, collectContactIssueItems, blankPrimaryCtaLinks } from "./contactIssues";
import type { LandingPageDraft, PageContact } from "@/types/schema.draft";

const draft = (contact: PageContact, extra: Record<string, unknown> = {}) =>
  ({
    contact,
    hero: { cta: { text: "Go", target: { kind: "primary" } } },
    sections: [],
    ...extra,
  } as unknown as LandingPageDraft);

const REAL: PageContact = { primary: "whatsapp", whatsapp: "+8613800138000" };

describe("collectContactIssues", () => {
  it("主渠道为真实号码、无占位 → 无问题", () => {
    expect(collectContactIssues(draft(REAL))).toEqual([]);
  });

  it("含模板占位号 15551234567 → 报占位问题", () => {
    const r = collectContactIssues(draft({ primary: "whatsapp", whatsapp: "+15551234567" }));
    expect(r.some((m) => m.includes("占位"))).toBe(true);
  });

  it("其他通道用同一占位号（电话）也检出", () => {
    const r = collectContactIssues(draft({ primary: "phone", phone: "+15557654321" }));
    expect(r.some((m) => m.includes("占位"))).toBe(true);
  });

  it("占位号出现在非主渠道也检出", () => {
    const r = collectContactIssues(draft({ ...REAL, phone: "+15553219876" }));
    expect(r.some((m) => m.includes("占位"))).toBe(true);
  });

  it("主渠道未填值 → 报无法联系问题", () => {
    const r = collectContactIssues(draft({ primary: "whatsapp" }));
    expect(r.some((m) => m.includes("无法联系你"))).toBe(true);
  });

  it("主渠道是表单但表单未启用 → 报落点无效问题", () => {
    const r = collectContactIssues(draft({ primary: "form" }));
    expect(r.some((m) => m.includes("留资表单未启用"))).toBe(true);
  });

  it("主渠道是表单且表单已启用 → 无问题（开箱即用，无需填联系方式）", () => {
    expect(collectContactIssues(draft({ primary: "form" }, { leadForm: { enabled: true } }))).toEqual([]);
  });

  it("悬浮按钮引用的渠道未填值 → 报问题，target 指向 floatingButton", () => {
    const d = draft(REAL, { floatingButton: { text: "Chat", target: { kind: "channel", channel: "telegram" } } });
    const hit = collectContactIssueItems(d).find((i) => i.message.includes("悬浮按钮指向"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "floatingButton" });
  });

  it("无悬浮按钮 → 不报悬浮相关问题", () => {
    expect(collectContactIssues(draft(REAL)).some((m) => m.includes("悬浮"))).toBe(false);
  });

  it("悬浮按钮引用的渠道已填且非占位 → 无问题", () => {
    const d = draft({ ...REAL, telegram: "brandsupport" }, {
      floatingButton: { text: "Chat", target: { kind: "channel", channel: "telegram" } },
    });
    expect(collectContactIssues(d)).toEqual([]);
  });

  it("首屏 CTA 文案为空 → 报文案问题，target 指向 hero", () => {
    const d = draft(REAL, { hero: { cta: { text: "  ", target: { kind: "primary" } } } });
    const hit = collectContactIssueItems(d).find((i) => i.message.includes("首屏 CTA 按钮文案为空"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "hero" });
  });

  it("悬浮按钮文案为空 → 报文案问题", () => {
    const d = draft(REAL, { floatingButton: { text: "", target: { kind: "primary" } } });
    const hit = collectContactIssueItems(d).find((i) => i.message.includes("悬浮按钮文案为空"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "floatingButton" });
  });
});

describe("blankPrimaryCtaLinks", () => {
  it("只清主渠道的值；其余渠道与文案不动", () => {
    const out = blankPrimaryCtaLinks(
      draft({ primary: "whatsapp", whatsapp: "+15551234567", email: "a@b.com", telegram: "brandsupport" }),
    );
    expect(out.contact.whatsapp).toBeUndefined();
    // 页脚业务邮箱与备用渠道改造前从不清空，这里也不能顺手清掉
    expect(out.contact.email).toBe("a@b.com");
    expect(out.contact.telegram).toBe("brandsupport");
    expect(out.hero.cta.text).toBe("Go");
  });

  it("即便主渠道是真实号码，模板实例化时也置空（模板默认非用户的联系方式）", () => {
    expect(blankPrimaryCtaLinks(draft(REAL)).contact.whatsapp).toBeUndefined();
  });

  it("主渠道是表单时不清任何值——表单没有「用户自己的值」可填，开箱即用", () => {
    const out = blankPrimaryCtaLinks(draft({ primary: "form", email: "a@b.com" }));
    expect(out.contact.primary).toBe("form");
    expect(out.contact.email).toBe("a@b.com");
  });

  it("不改动原对象（深拷贝）", () => {
    const d = draft({ primary: "whatsapp", whatsapp: "+15551234567" });
    blankPrimaryCtaLinks(d);
    expect(d.contact.whatsapp).toBe("+15551234567");
  });
});
