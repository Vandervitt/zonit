import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingPage } from "./LandingPage";
import { deriveVariant, IDENTITY_VARIANT, type PageVariant } from "./variant";
import { petDraft } from "@/landing-editor/samples/petDraft";

const render = (variant: PageVariant = IDENTITY_VARIANT) =>
  renderToStaticMarkup(createElement(LandingPage, { page: petDraft, pageId: "p1", variant }));

describe("反同质化指纹", () => {
  it("默认（不传 variant）= 恒等，与显式 IDENTITY_VARIANT 逐字节一致", () => {
    const a = renderToStaticMarkup(createElement(LandingPage, { page: petDraft, pageId: "p1" }));
    expect(a).toBe(render(IDENTITY_VARIANT));
  });

  it("打散后 HTML 与恒等不同", () => {
    expect(render(deriveVariant("seed-a"))).not.toBe(render(IDENTITY_VARIANT));
  });

  it("不同种子 HTML 不同", () => {
    expect(render(deriveVariant("seed-a"))).not.toBe(render(deriveVariant("seed-b")));
  });

  it("打散不改可见文案（标题片段仍在）", () => {
    // 注：hero.title 含撇号，HTML 会转义为 &#x27;，故断言不含撇号的安全片段。
    const html = render(deriveVariant("seed-a"));
    expect(html).toContain("The right gear for your pet");
  });
});
