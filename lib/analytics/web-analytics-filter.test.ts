// Vercel Web Analytics 过滤契约：后台与预览是运营者自己的访问，不计入营销站访客。
import { describe, it, expect } from "vitest";
import { isOperatorPath, webAnalyticsBeforeSend } from "./web-analytics-filter";

describe("isOperatorPath", () => {
  it.each(["/admin", "/admin/landing-pages", "/super-admin", "/super-admin/users", "/preview/abc"])(
    "%s 是后台/预览路径",
    (path) => {
      expect(isOperatorPath(path)).toBe(true);
    },
  );

  it.each(["/", "/zh", "/templates/b2b-sourcing", "/guides/b2b-rfq-lead-generation", "/login", "/administrator", "/previews"])(
    "%s 是营销站路径（前缀必须按路径段匹配）",
    (path) => {
      expect(isOperatorPath(path)).toBe(false);
    },
  );
});

describe("webAnalyticsBeforeSend", () => {
  it("丢弃后台页面的 pageview", () => {
    expect(webAnalyticsBeforeSend({ type: "pageview", url: "https://urgizat.com/super-admin/users?q=1" })).toBeNull();
  });

  it("保留营销站页面的 pageview 原样", () => {
    const event = { type: "pageview" as const, url: "https://urgizat.com/zh/templates/industry/b2b" };
    expect(webAnalyticsBeforeSend(event)).toBe(event);
  });

  it("URL 无法解析时保留事件，不静默丢数据", () => {
    const event = { type: "pageview" as const, url: "not a url" };
    expect(webAnalyticsBeforeSend(event)).toBe(event);
  });
});
