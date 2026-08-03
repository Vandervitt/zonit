// lib/tools/robots.test.ts
//
// 我们一边在报告里标记「该页屏蔽了爬虫」，一边自己就得遵守 robots——否则立场
// 不成立。命中 Disallow 时不抓取，并把这件事本身作为一条发现项呈现
//（设计文档第十二节决议 1）。
//
// 匹配规则按 RFC 9309 的核心部分实现：分组选择取最具体的 User-agent，
// 规则匹配取最长匹配，长度相同时 Allow 胜出。
import { describe, it, expect } from "vitest";
import { isAllowed } from "./robots";

const UA = "ZapBridgeLandingPageCheck";

describe("isAllowed · 基本语义", () => {
  it("空 robots 视为全部允许", () => {
    expect(isAllowed("", "/lp", UA)).toBe(true);
  });

  it("无匹配分组时允许", () => {
    expect(isAllowed("User-agent: Googlebot\nDisallow: /", "/lp", UA)).toBe(true);
  });

  it("通配分组的 Disallow: / 拦截一切", () => {
    expect(isAllowed("User-agent: *\nDisallow: /", "/lp", UA)).toBe(false);
  });

  it("空 Disallow 表示允许全部", () => {
    expect(isAllowed("User-agent: *\nDisallow:", "/lp", UA)).toBe(true);
  });

  it("只拦子路径时其他路径仍允许", () => {
    const txt = "User-agent: *\nDisallow: /admin";
    expect(isAllowed(txt, "/admin/x", UA)).toBe(false);
    expect(isAllowed(txt, "/lp", UA)).toBe(true);
  });
});

describe("isAllowed · 分组选择", () => {
  it("精确匹配的 UA 分组优先于通配分组", () => {
    const txt = `User-agent: *\nDisallow: /\n\nUser-agent: ${UA}\nDisallow:`;
    expect(isAllowed(txt, "/lp", UA)).toBe(true);
  });

  it("UA 匹配不区分大小写", () => {
    const txt = `User-agent: zapbridgelandingpagecheck\nDisallow: /`;
    expect(isAllowed(txt, "/lp", UA)).toBe(false);
  });

  it("同一分组可声明多个 User-agent", () => {
    const txt = `User-agent: Googlebot\nUser-agent: ${UA}\nDisallow: /x`;
    expect(isAllowed(txt, "/x/1", UA)).toBe(false);
  });
});

describe("isAllowed · 最长匹配与 Allow 优先", () => {
  it("更长的 Allow 覆盖更短的 Disallow", () => {
    const txt = "User-agent: *\nDisallow: /a\nAllow: /a/b";
    expect(isAllowed(txt, "/a/b/c", UA)).toBe(true);
    expect(isAllowed(txt, "/a/z", UA)).toBe(false);
  });

  it("长度相同时 Allow 胜出", () => {
    const txt = "User-agent: *\nDisallow: /page\nAllow: /page";
    expect(isAllowed(txt, "/page", UA)).toBe(true);
  });
});

describe("isAllowed · 通配符与结束锚点", () => {
  it("支持 * 通配", () => {
    const txt = "User-agent: *\nDisallow: /*.pdf";
    expect(isAllowed(txt, "/files/a.pdf", UA)).toBe(false);
    expect(isAllowed(txt, "/files/a.html", UA)).toBe(true);
  });

  it("支持 $ 结束锚点", () => {
    const txt = "User-agent: *\nDisallow: /lp$";
    expect(isAllowed(txt, "/lp", UA)).toBe(false);
    expect(isAllowed(txt, "/lp/sub", UA)).toBe(true);
  });
});

describe("isAllowed · 容错", () => {
  it("忽略注释与空行", () => {
    const txt = "# comment\n\nUser-agent: *\n# another\nDisallow: /x\n";
    expect(isAllowed(txt, "/x", UA)).toBe(false);
  });

  it("忽略无法识别的指令（Crawl-delay / Sitemap）", () => {
    const txt = "User-agent: *\nCrawl-delay: 10\nSitemap: https://x/s.xml\nDisallow: /y";
    expect(isAllowed(txt, "/y", UA)).toBe(false);
    expect(isAllowed(txt, "/z", UA)).toBe(true);
  });

  it("robots 拉取失败由调用方决定，本函数对空输入放行", () => {
    expect(isAllowed("", "/anything", UA)).toBe(true);
  });
});
