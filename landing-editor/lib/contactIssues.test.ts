// 发布门槛的联系方式校验。改造后号码只存在 contact 一处，故断言从「链接是否为空」
// 变成「引用的渠道有没有值」——意图不变：访客点了 CTA 必须能联系到人。
import { describe, it, expect } from "vitest";
import { collectContactIssues, collectContactIssueItems, blankTemplateContacts } from "./contactIssues";
import type { LandingPageDraft, PageContact } from "@/types/schema.draft";

import { getAdminDictionary } from "@/lib/i18n/admin";

// 这些断言认的是中文文案子串，故显式钉中文字典，不依赖 defaultLocale——
// 后者是英文，且以后可能再变；测试要的是确定性，不是跟着默认值漂。
const zh = getAdminDictionary("zh").editor.issues;

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
    expect(collectContactIssues(draft(REAL), zh)).toEqual([]);
  });

  it("主渠道未填值 → 报无法联系问题", () => {
    const r = collectContactIssues(draft({ primary: "whatsapp" }), zh);
    expect(r.some((m) => m.includes("无法联系你"))).toBe(true);
  });

  it("主渠道是表单但表单未启用 → 报落点无效问题", () => {
    const r = collectContactIssues(draft({ primary: "form" }), zh);
    expect(r.some((m) => m.includes("留资表单未启用"))).toBe(true);
  });

  it("主渠道是表单且表单已启用 → 无问题（开箱即用，无需填联系方式）", () => {
    expect(collectContactIssues(draft({ primary: "form" }, { leadForm: { enabled: true } }), zh)).toEqual([]);
  });

  it("悬浮按钮引用的渠道未填值 → 报问题，target 指向 floatingButton", () => {
    const d = draft(REAL, { floatingButton: { text: "Chat", target: { kind: "channel", channel: "telegram" } } });
    const hit = collectContactIssueItems(d, zh).find((i) => i.message.includes("悬浮按钮指向"));
    expect(hit).toBeDefined();
    // 落点指向联系方式面板：用户要改的是号码，不是按钮本身
    expect(hit?.target).toEqual({ kind: "fixed", id: "contact" });
  });

  it("无悬浮按钮 → 不报悬浮相关问题", () => {
    expect(collectContactIssues(draft(REAL), zh).some((m) => m.includes("悬浮"))).toBe(false);
  });

  it("悬浮按钮引用的渠道已填且非占位 → 无问题", () => {
    const d = draft({ ...REAL, telegram: "brandsupport" }, {
      floatingButton: { text: "Chat", target: { kind: "channel", channel: "telegram" } },
    });
    expect(collectContactIssues(d, zh)).toEqual([]);
  });

  it("首屏 CTA 文案为空 → 报文案问题，target 指向 hero", () => {
    const d = draft(REAL, { hero: { cta: { text: "  ", target: { kind: "primary" } } } });
    const hit = collectContactIssueItems(d, zh).find((i) => i.message.includes("首屏 CTA 按钮文案为空"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "hero" });
  });

  it("悬浮按钮文案为空 → 报文案问题", () => {
    const d = draft(REAL, { floatingButton: { text: "", target: { kind: "primary" } } });
    const hit = collectContactIssueItems(d, zh).find((i) => i.message.includes("悬浮按钮文案为空"));
    expect(hit).toBeDefined();
    expect(hit?.target).toEqual({ kind: "fixed", id: "floatingButton" });
  });
});

describe("blankTemplateContacts", () => {
  it("清空全部渠道值；primary 与文案保留", () => {
    const out = blankTemplateContacts(
      draft({ primary: "whatsapp", whatsapp: "+15551234567", email: "a@b.com", telegram: "brandsupport" }),
    );
    expect(out.contact.whatsapp).toBeUndefined();
    expect(out.contact.email).toBeUndefined();
    expect(out.contact.telegram).toBeUndefined();
    // primary 是模板对「这个行业通常怎么接客户」的建议，保留作默认值
    expect(out.contact.primary).toBe("whatsapp");
    expect(out.hero.cta.text).toBe("Go");
  });

  it("主渠道是表单时也清掉备用渠道的假号码", () => {
    // b2b-sourcing 就是这种：主渠道是表单，但悬浮按钮钉在 whatsapp 上，
    // 只清主渠道的话那个按钮会指着模板占位号
    const out = blankTemplateContacts(draft({ primary: "form", whatsapp: "+15551234567", email: "a@b.com" }));
    expect(out.contact.primary).toBe("form");
    expect(out.contact.whatsapp).toBeUndefined();
    expect(out.contact.email).toBeUndefined();
  });

  it("不改动原对象（深拷贝）", () => {
    const d = draft({ primary: "whatsapp", whatsapp: "+15551234567" });
    blankTemplateContacts(d);
    expect(d.contact.whatsapp).toBe("+15551234567");
  });
});
