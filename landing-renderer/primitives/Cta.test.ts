// landing-renderer/primitives/Cta.test.ts
// 空链接 / 空文案守卫：CTA 按钮内容不完整时不渲染，避免线上出现 href="" 的死按钮
// （覆盖发布校验上线前的存量已发布页，以及可选按钮「对象存在但字段为空」的场景）。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Cta } from "./Cta";
import type { RendererTheme } from "../theme";

const theme = {
  accentGradient: "bg-a",
  accentGradientHover: "hover:bg-b",
  accentShadow: "shadow-c",
} as RendererTheme;

const html = (text: string, link: string, variant?: "primary" | "secondary", preview?: boolean) =>
  renderToStaticMarkup(createElement(Cta, { cta: { text, link }, theme, variant, preview }));

describe("Cta 空内容守卫", () => {
  it("链接为空 → 不渲染（primary）", () => {
    expect(html("Chat", "")).toBe("");
  });

  it("链接为空白 → 不渲染（secondary）", () => {
    expect(html("Chat", "   ", "secondary")).toBe("");
  });

  it("文案为空 → 不渲染", () => {
    expect(html("  ", "https://wa.me/8613800138000")).toBe("");
  });

  it("内容完整 → 正常渲染带 href", () => {
    const out = html("Chat", "https://wa.me/8613800138000");
    expect(out).toContain('href="https://wa.me/8613800138000"');
    expect(out).toContain("Chat");
  });
});

describe("Cta 预览占位态", () => {
  it("预览 + 链接为空 → 渲染不可点击占位，保留文案并标注线上不显示", () => {
    const out = html("Chat", "", "primary", true);
    expect(out).not.toContain("<a");
    expect(out).toContain("Chat");
    expect(out).toContain("链接未填");
    expect(out).toContain("线上不显示");
  });

  it("预览 + 文案为空 → 占位标注文案未填", () => {
    const out = html("", "https://wa.me/8613800138000", "secondary", true);
    expect(out).not.toContain("<a");
    expect(out).toContain("文案未填");
    expect(out).toContain("线上不显示");
  });

  it("预览 + 内容完整 → 与线上一致正常渲染", () => {
    const out = html("Chat", "https://wa.me/8613800138000", "primary", true);
    expect(out).toContain('href="https://wa.me/8613800138000"');
    expect(out).not.toContain("线上不显示");
  });

  it("非预览 + 不完整 → 仍不渲染（线上守卫不受影响）", () => {
    expect(html("Chat", "", "primary", false)).toBe("");
  });
});
