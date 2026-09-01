import { describe, expect, it } from "vitest";
import { switchPrimaryChannel } from "./switchChannel";
import type { LandingPageDraft } from "@/types/schema.draft";

const draft = (over: Record<string, unknown> = {}) =>
  ({
    contact: { primary: "whatsapp", whatsapp: "+8613800138000" },
    hero: {
      cta: {
        text: "Chat on WhatsApp",
        textByChannel: { whatsapp: "Chat on WhatsApp", form: "Request a quote" },
        target: { kind: "primary" },
      },
    },
    sections: [],
    footer: { brandName: "B", copyrightYear: "2026", privacyPolicy: "p", termsOfService: "t" },
    ...over,
  }) as unknown as LandingPageDraft;

describe("switchPrimaryChannel", () => {
  it("切渠道时把该渠道的文案写进 text", () => {
    const out = switchPrimaryChannel(draft(), "form");
    expect(out.contact.primary).toBe("form");
    expect(out.hero.cta.text).toBe("Request a quote");
  });

  it("用户手改过文案则不覆盖", () => {
    const d = draft({
      hero: {
        cta: {
          text: "我自己写的文案",
          textEdited: true,
          textByChannel: { whatsapp: "Chat on WhatsApp", form: "Request a quote" },
          target: { kind: "primary" },
        },
      },
    });
    expect(switchPrimaryChannel(d, "form").hero.cta.text).toBe("我自己写的文案");
  });

  it("目标渠道没有备好文案时保留原文案，不清空", () => {
    // 空按钮比措辞不贴切的按钮糟糕得多
    const out = switchPrimaryChannel(draft(), "telegram");
    expect(out.hero.cta.text).toBe("Chat on WhatsApp");
  });

  it("只影响跟随主渠道的 CTA，钉死渠道的不动", () => {
    const d = draft({
      floatingButton: {
        text: "Chat on WhatsApp",
        textByChannel: { whatsapp: "Chat on WhatsApp", form: "Request a quote" },
        target: { kind: "channel", channel: "whatsapp" },
      },
    });
    const out = switchPrimaryChannel(d, "form");
    expect(out.floatingButton?.text).toBe("Chat on WhatsApp");
  });

  it("深入 sections 改写跟随主渠道的 CTA", () => {
    const d = draft({
      sections: [
        {
          type: "plans",
          data: {
            items: [
              {
                cta: {
                  text: "Chat now",
                  textByChannel: { whatsapp: "Chat now", form: "Get a quote" },
                  target: { kind: "primary" },
                },
              },
            ],
          },
        },
      ],
    });
    const out = switchPrimaryChannel(d, "form");
    const cta = (out.sections[0] as unknown as { data: { items: { cta: { text: string } }[] } }).data.items[0].cta;
    expect(cta.text).toBe("Get a quote");
  });

  it("不改动原对象（深拷贝）", () => {
    const d = draft();
    switchPrimaryChannel(d, "form");
    expect(d.contact.primary).toBe("whatsapp");
    expect(d.hero.cta.text).toBe("Chat on WhatsApp");
  });
});

// 区块级 CTA（features / process / reviews / caseStudy）是后加的落点。
// switchPrimaryChannel 靠深度遍历找 CTA 形状的对象，不认区块类型——
// 这几条用例就是钉死「后加的落点不用改这里也能被覆盖到」这个前提。
describe("switchPrimaryChannel · 区块级 CTA", () => {
  const withSectionCta = () =>
    draft({
      sections: [
        {
          type: "features",
          data: {
            title: "What you get",
            items: [],
            cta: {
              text: "Chat on WhatsApp",
              textByChannel: { whatsapp: "Chat on WhatsApp", form: "Request a quote" },
              target: { kind: "primary" },
            },
          },
        },
      ],
    });

  it("跟随主渠道的区块 CTA 会换文案", () => {
    const out = switchPrimaryChannel(withSectionCta(), "form");
    const cta = (out.sections[0].data as { cta: { text: string } }).cta;
    expect(cta.text).toBe("Request a quote");
  });

  it("用户手改过的区块 CTA 不被覆盖", () => {
    const d = withSectionCta();
    (d.sections[0].data as { cta: { textEdited?: boolean } }).cta.textEdited = true;
    const out = switchPrimaryChannel(d, "form");
    expect((out.sections[0].data as { cta: { text: string } }).cta.text).toBe("Chat on WhatsApp");
  });

  it("钉死渠道的区块 CTA 不跟随", () => {
    const d = withSectionCta();
    (d.sections[0].data as { cta: { target: unknown } }).cta.target = {
      kind: "channel",
      channel: "whatsapp",
    };
    const out = switchPrimaryChannel(d, "form");
    expect((out.sections[0].data as { cta: { text: string } }).cta.text).toBe("Chat on WhatsApp");
  });

  it("caseStudy 这种新区块同样被覆盖到（遍历不认类型）", () => {
    const d = draft({
      sections: [
        {
          type: "caseStudy",
          data: {
            title: "Client results",
            items: [],
            cta: {
              text: "Chat on WhatsApp",
              textByChannel: { form: "Request a quote" },
              target: { kind: "primary" },
            },
          },
        },
      ],
    });
    const out = switchPrimaryChannel(d, "form");
    expect((out.sections[0].data as { cta: { text: string } }).cta.text).toBe("Request a quote");
  });
});
