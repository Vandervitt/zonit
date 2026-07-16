import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Hero } from "./sections/Hero";
import { defaultTheme } from "./theme";
import type { HeroSection } from "@/types/schema.draft";
import type { HeroLayout } from "./variant";

const data: HeroSection = {
  backgroundImage: { src: "https://x/bg.jpg", alt: "bg" },
  badge: { emoji: "✨", text: "Badge" },
  title: "Hero Title Here",
  subtitle: "Hero subtitle here",
  cta: { text: "Get started", link: "https://wa.me/1" },
  secondaryCta: { text: "Learn more", link: "https://example.com" },
  endorsementText: "Trusted widely",
  showcase: { type: "image", src: "https://x/show.jpg", alt: "show" },
};

const render = (layout?: HeroLayout) =>
  renderToStaticMarkup(createElement(Hero, { data, theme: defaultTheme, layout }));

const LAYOUTS: HeroLayout[] = ["background", "split-right", "split-left", "centered"];

describe("Hero 布局变体", () => {
  it("四种布局均渲染且含标题与主 CTA", () => {
    for (const l of LAYOUTS) {
      const html = render(l);
      expect(html).toContain("Hero Title Here");
      expect(html).toContain("Get started");
    }
  });

  it("缺省 = background", () => {
    expect(render()).toBe(render("background"));
  });

  it("非 background 布局与 background 的 HTML 不同", () => {
    const bg = render("background");
    expect(render("split-right")).not.toBe(bg);
    expect(render("split-left")).not.toBe(bg);
    expect(render("centered")).not.toBe(bg);
  });

  it("split-left 与 split-right 不同（列序不同）", () => {
    expect(render("split-left")).not.toBe(render("split-right"));
  });
});
