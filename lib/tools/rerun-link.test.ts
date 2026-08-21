import { describe, it, expect } from "vitest";
import { pageCheckWithUrl } from "./rerun-link";
import { Routes } from "@/lib/constants";

describe("pageCheckWithUrl", () => {
  it("把原始 URL 编码进查询参数", () => {
    const href = pageCheckWithUrl("https://go.example.com/lp?utm_source=fb&a=1");
    expect(href.startsWith(`${Routes.PageCheck}?url=`)).toBe(true);
    // 原始 URL 自带的 & 与 ? 必须编码，否则会被当成自检器自己的参数。
    expect(href).not.toContain("&a=1");
    const parsed = new URLSearchParams(href.slice(href.indexOf("?") + 1));
    expect(parsed.get("url")).toBe("https://go.example.com/lp?utm_source=fb&a=1");
  });

  it("空 URL 退回自检器首页而不是留一个空参数", () => {
    expect(pageCheckWithUrl("")).toBe(Routes.PageCheck);
    expect(pageCheckWithUrl("   ")).toBe(Routes.PageCheck);
  });

  it("截断畸形超长 URL", () => {
    const href = pageCheckWithUrl(`https://example.com/${"a".repeat(5000)}`);
    expect(href.length).toBeLessThan(3000);
  });

  it("返回不带语言前缀的路径（前缀由 localePath 负责）", () => {
    expect(pageCheckWithUrl("https://example.com").startsWith("/zh")).toBe(false);
  });
});
