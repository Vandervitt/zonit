import { describe, it, expect } from "vitest";
import { locales, defaultLocale, htmlLang, ogLocale } from "./config";
import { LOCALIZED_ROUTES, localePath, stripLocale, isLocalizedRoute } from "./routes";

describe("i18n config", () => {
  it("英文是默认 locale，且只支持 en/zh", () => {
    expect(defaultLocale).toBe("en");
    expect([...locales]).toEqual(["en", "zh"]);
  });

  it("每个 locale 都有 html lang 与 og locale 映射", () => {
    expect(htmlLang.en).toBe("en");
    expect(htmlLang.zh).toBe("zh-Hans");
    expect(ogLocale.en).toBe("en_US");
    expect(ogLocale.zh).toBe("zh_CN");
  });
});

describe("localePath", () => {
  it("英文不加前缀", () => {
    expect(localePath("en", "/")).toBe("/");
    expect(localePath("en", "/pricing")).toBe("/pricing");
  });

  it("中文加 /zh 前缀，根路径特判为 /zh 而非 /zh/", () => {
    expect(localePath("zh", "/")).toBe("/zh");
  });

  it("非营销路由一律不加前缀——加了会 404", () => {
    expect(localePath("zh", "/admin")).toBe("/admin");
    expect(localePath("zh", "/admin/billing")).toBe("/admin/billing");
    expect(localePath("zh", "/api/leads")).toBe("/api/leads");
    expect(localePath("zh", "/p/some-slug")).toBe("/p/some-slug");
  });

  it("带 hash / query 的营销路径仍能正确加前缀", () => {
    expect(localePath("zh", "/#pricing")).toBe("/zh#pricing");
    expect(localePath("zh", "/?utm_source=x")).toBe("/zh?utm_source=x");
  });
});

describe("stripLocale", () => {
  it("剥掉 /zh 前缀并回报 locale", () => {
    expect(stripLocale("/zh")).toEqual({ locale: "zh", pathname: "/" });
    expect(stripLocale("/zh/pricing")).toEqual({ locale: "zh", pathname: "/pricing" });
  });

  it("无前缀视为英文", () => {
    expect(stripLocale("/")).toEqual({ locale: "en", pathname: "/" });
    expect(stripLocale("/pricing")).toEqual({ locale: "en", pathname: "/pricing" });
  });

  it("不把 /zhen 这类同前缀路径误判成中文", () => {
    expect(stripLocale("/zhen")).toEqual({ locale: "en", pathname: "/zhen" });
  });

  it("localePath 与 stripLocale 互为逆运算", () => {
    for (const route of LOCALIZED_ROUTES) {
      for (const locale of locales) {
        expect(stripLocale(localePath(locale, route))).toEqual({ locale, pathname: route });
      }
    }
  });
});

describe("isLocalizedRoute", () => {
  it("清单内路由为真", () => {
    expect(isLocalizedRoute("/")).toBe(true);
  });

  it("尚未镜像的营销页为假——分期交付期间必须降级到英文侧路径，否则链到 404", () => {
    // PR 1 只镜像了首页。/templates 的 /zh 镜像要到 PR 3 才存在，
    // 此时中文首页导航里的「模板库」必须仍指向 /templates（内容尚为中文，正好合适）。
    expect(isLocalizedRoute("/templates")).toBe(false);
    expect(localePath("zh", "/templates")).toBe("/templates");
    expect(isLocalizedRoute("/guides")).toBe(false);
    expect(localePath("zh", "/guides")).toBe("/guides");
  });

  it("后台与接口为假", () => {
    expect(isLocalizedRoute("/admin")).toBe(false);
    expect(isLocalizedRoute("/api/leads")).toBe(false);
  });
});
