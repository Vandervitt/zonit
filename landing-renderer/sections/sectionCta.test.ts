// landing-renderer/sections/sectionCta.test.ts
//
// 区块级 CTA 的两条硬约束：
//  1) 不填就完全不出现——54 套现成模板都没有这个字段，加字段不能改变它们的渲染；
//  2) 填了但不完整时**线上不渲染**（避免 href="" 的死按钮），预览才显示占位。
// 第 2 条的实现在 Cta 组件里，这里验证区块确实把 preview 透传下去了，
// 否则「预览能看到、线上不出现」这条规则在新区块上会静默失效。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Features } from "./Features";
import { CaseStudy } from "./CaseStudy";
import { LogoWall } from "./LogoWall";
import type { RendererTheme } from "../theme";
import type { PageContact, CtaButton } from "@/types/schema.draft";

const theme = {
  accentGradient: "bg-a",
  accentShadow: "shadow-c",
  accentText: "text-a",
  accentIconBg: "bg-i",
} as RendererTheme;

const contact: PageContact = { primary: "whatsapp", whatsapp: "+8613800138000" };
const cta = (over: Partial<CtaButton> = {}): CtaButton => ({
  text: "Book a free assessment",
  target: { kind: "primary" },
  ...over,
});

const html = (el: Parameters<typeof renderToStaticMarkup>[0]) => renderToStaticMarkup(el);

describe("区块级 CTA", () => {
  it("不填 cta 时区块里没有任何按钮（现有模板的渲染不受影响）", () => {
    const out = html(
      createElement(Features, {
        data: { title: "What you get", items: [] },
        contact,
        theme,
      }),
    );
    expect(out).not.toContain("Book a free assessment");
    expect(out).not.toContain("<a");
  });

  it("填了 cta 就渲染成可点击链接", () => {
    const out = html(
      createElement(Features, {
        data: { title: "What you get", items: [], cta: cta() },
        contact,
        theme,
      }),
    );
    expect(out).toContain("Book a free assessment");
    expect(out).toContain("wa.me");
  });

  it("文案为空时线上不渲染，预览才出占位", () => {
    const data = { title: "T", items: [], cta: cta({ text: "" }) };
    const live = html(createElement(Features, { data, contact, theme }));
    expect(live).not.toContain("wa.me");
    const preview = html(createElement(Features, { data, contact, theme, preview: true }));
    expect(preview).toContain("CTA");
  });

  it("caseStudy 同样支持区块级 CTA", () => {
    const out = html(
      createElement(CaseStudy, {
        data: { title: "Client results", items: [], cta: cta() },
        contact,
        theme,
      }),
    );
    expect(out).toContain("Book a free assessment");
  });
});

describe("新区块的渲染约束", () => {
  // ⚠️ 指标值别用「3x」这类短串做断言：Tailwind 的 sm:text-3xl 里就含 "3x"，
  // 子串断言会误判成「渲染了」。用不可能出现在 class 名里的值。
  it("caseStudy：指标只有一半时不渲染（缺一半看起来像没加载出来）", () => {
    const only = html(
      createElement(CaseStudy, {
        data: {
          title: "T",
          items: [{ client: "Acme", summary: "Booked out in 3 weeks", metricValue: "412%" }],
        },
        contact,
        theme,
      }),
    );
    expect(only).not.toContain("412%");

    const both = html(
      createElement(CaseStudy, {
        data: {
          title: "T",
          items: [
            { client: "Acme", summary: "s", metricValue: "412%", metricLabel: "more enquiries" },
          ],
        },
        contact,
        theme,
      }),
    );
    expect(both).toContain("412%");
    expect(both).toContain("more enquiries");
  });

  // schema 里承诺 name 兼作 alt（无障碍与 SEO）。不真的传下去，那句注释就是假的。
  it("logoWall：品牌名兜底成图片 alt", () => {
    const out = html(
      createElement(LogoWall, {
        data: { title: "Trusted by", items: [{ image: { src: "https://x/a.png" }, name: "Acme" }] },
      }),
    );
    expect(out).toContain('alt="Acme"');
  });

  it("logoWall：图片自带 alt 时以图片为准", () => {
    const out = html(
      createElement(LogoWall, {
        data: {
          title: "T",
          items: [{ image: { src: "https://x/a.png", alt: "Acme logo" }, name: "Acme" }],
        },
      }),
    );
    expect(out).toContain('alt="Acme logo"');
  });
});
