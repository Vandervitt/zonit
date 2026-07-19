// landing-renderer/sections/FloatingButton.test.ts
// 空链接 / 空文案守卫：悬浮按钮常驻右下角，内容不完整时必须整体不渲染，
// 否则线上出现点了回页顶的死按钮（覆盖发布校验上线前的存量已发布页）。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FloatingButton } from "./FloatingButton";
import type { RendererTheme } from "../theme";

const theme = { accentGradient: "bg-a", accentShadow: "shadow-c" } as RendererTheme;

const html = (text: string, link: string, preview?: boolean) =>
  renderToStaticMarkup(createElement(FloatingButton, { data: { text, link }, theme, preview }));

describe("FloatingButton 空内容守卫", () => {
  it("链接为空 → 不渲染", () => {
    expect(html("Chat", "  ")).toBe("");
  });

  it("文案为空 → 不渲染", () => {
    expect(html("", "https://wa.me/8613800138000")).toBe("");
  });

  it("内容完整 → 正常渲染带 href", () => {
    const out = html("Chat", "https://wa.me/8613800138000");
    expect(out).toContain('href="https://wa.me/8613800138000"');
    expect(out).toContain("Chat");
  });
});

describe("FloatingButton 预览占位态", () => {
  it("预览 + 链接为空 → 渲染不可点击占位并标注线上不显示", () => {
    const out = html("Chat", "", true);
    expect(out).not.toContain("<a");
    expect(out).toContain("Chat");
    expect(out).toContain("链接未填");
    expect(out).toContain("线上不显示");
  });

  it("预览 + 内容完整 → 与线上一致正常渲染", () => {
    const out = html("Chat", "https://wa.me/8613800138000", true);
    expect(out).toContain('href="https://wa.me/8613800138000"');
    expect(out).not.toContain("线上不显示");
  });

  it("非预览 + 不完整 → 仍不渲染", () => {
    expect(html("Chat", "", false)).toBe("");
  });
});
