import { describe, expect, it } from "vitest";
import { applyBriefChannels, parseBriefChannels } from "./brief-contact";
import type { LandingPageDraft } from "@/types/schema.draft";

// 52 套模板全部带 leadForm（PR #144），故夹具照此构造
const draft = (leadForm: unknown = { enabled: false }) =>
  ({
    contact: { primary: "whatsapp" as const },
    hero: { cta: { text: "Chat", target: { kind: "primary" as const } } },
    sections: [],
    footer: { brandName: "B", copyrightYear: "2026", privacyPolicy: "p", termsOfService: "t" },
    ...(leadForm === null ? {} : { leadForm }),
  }) as unknown as LandingPageDraft;

describe("parseBriefChannels", () => {
  it("把界面标签映射成渠道键，保持勾选顺序", () => {
    expect(parseBriefChannels("电话、在线留资表单")).toEqual(["phone", "form"]);
  });

  it("忽略无法识别的词，不猜", () => {
    expect(parseBriefChannels("微信、WhatsApp")).toEqual(["whatsapp"]);
  });

  it("空输入返回空数组", () => {
    expect(parseBriefChannels(undefined)).toEqual([]);
    expect(parseBriefChannels("  ")).toEqual([]);
  });
});

describe("applyBriefChannels", () => {
  it("第一个勾选的渠道成为主渠道", () => {
    const out = applyBriefChannels(draft(), "电话、WhatsApp");
    expect(out.contact.primary).toBe("phone");
  });

  it("主渠道是表单时同步启用留资表单——否则访客点了原地不动", () => {
    const out = applyBriefChannels(draft(), "在线留资表单");
    expect(out.contact.primary).toBe("form");
    expect(out.leadForm?.enabled).toBe(true);
  });

  it("没勾表单时不动 leadForm 的启用状态", () => {
    expect(applyBriefChannels(draft(), "WhatsApp").leadForm?.enabled).toBe(false);
  });

  it("模板本身没有表单时不凭空造一个——结构由模板决定，交给发布门槛拦", () => {
    const out = applyBriefChannels(draft(null), "在线留资表单");
    expect(out.contact.primary).toBe("form");
    expect(out.leadForm).toBeUndefined();
  });

  it("没勾任何渠道时保持模板默认，不擅自改", () => {
    expect(applyBriefChannels(draft(), undefined).contact.primary).toBe("whatsapp");
    expect(applyBriefChannels(draft(), "微信").contact.primary).toBe("whatsapp");
  });

  it("不填任何联系方式的值——AI 编不出用户的真实号码", () => {
    const out = applyBriefChannels(draft(), "电话");
    expect(out.contact.phone).toBeUndefined();
  });

  it("不改动原对象（深拷贝）", () => {
    const d = draft();
    applyBriefChannels(d, "电话");
    expect(d.contact.primary).toBe("whatsapp");
  });
});
