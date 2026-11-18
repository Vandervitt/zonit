import { describe, it, expect } from "vitest";
import {
  marketingEntries,
  localizedDetailEntries,
  PENDING_ROUTES,
  SITEMAP_EXCLUDED_ROUTES,
  NOINDEX_PATHS,
} from "./sitemap-entries";
import { LOCALIZED_ROUTES } from "@/lib/i18n/routes";

const BASE = "https://zapbridge.tech";
const NOW = new Date("2026-07-27T00:00:00Z");

describe("marketingEntries", () => {
  it("已国际化路由输出双语两条（登录/注册页、noindex 页除外）", () => {
    const urls = marketingEntries(BASE, NOW).map((e) => e.url);
    for (const route of LOCALIZED_ROUTES) {
      if (SITEMAP_EXCLUDED_ROUTES.includes(route)) continue;
      const en = route === "/" ? `${BASE}/` : `${BASE}${route}`;
      const zh = route === "/" ? `${BASE}/zh` : `${BASE}/zh${route}`;
      // 两侧都在 NOINDEX_PATHS 里的路由（如 /templates）整条不出；
      // 只一侧在里面的，另一侧照常出（见 NOINDEX_PATHS 测试）。
      const enPath = route === "/" ? "/" : route;
      const zhPath = route === "/" ? "/zh" : `/zh${route}`;
      if (NOINDEX_PATHS.includes(enPath) && NOINDEX_PATHS.includes(zhPath)) continue;
      expect(urls).toContain(en);
      expect(urls).toContain(zh);
    }
  });

  it("登录/注册页不进 sitemap——没有搜索价值，不分抓取预算", () => {
    const urls = marketingEntries(BASE, NOW).map((e) => e.url);
    for (const route of SITEMAP_EXCLUDED_ROUTES) {
      expect(urls).not.toContain(`${BASE}${route}`);
      expect(urls).not.toContain(`${BASE}/zh${route}`);
    }
  });

  it("双语条目都带 en / zh-Hans 两个 alternates", () => {
    const entries = marketingEntries(BASE, NOW);
    const expected = { en: `${BASE}/`, "zh-Hans": `${BASE}/zh` };
    expect(entries.find((e) => e.url === `${BASE}/`)?.alternates?.languages).toEqual(expected);
    expect(entries.find((e) => e.url === `${BASE}/zh`)?.alternates?.languages).toEqual(expected);
  });

  it("全部营销页均已国际化——PENDING_ROUTES 已清空", () => {
    expect(PENDING_ROUTES).toEqual([]);
  });

  it("每条营销条目都带 alternates（不再有单语遗留）", () => {
    for (const e of marketingEntries(BASE, NOW)) {
      expect(e.alternates?.languages, e.url).toBeDefined();
    }
  });

  it("各营销页出双语两条并互挂 hreflang", () => {
    const entries = marketingEntries(BASE, NOW);
    const urls = entries.map((e) => e.url);
    for (const route of ["/pricing", "/anti-ban", "/guides"]) {
      expect(urls).toContain(`${BASE}${route}`);
      expect(urls).toContain(`${BASE}/zh${route}`);
      expect(entries.find((e) => e.url === `${BASE}${route}`)?.alternates?.languages).toEqual({
        en: `${BASE}${route}`,
        "zh-Hans": `${BASE}/zh${route}`,
      });
    }
  });

  it("NOINDEX_PATHS 的页不进 sitemap——谷歌已判定不收录，不分抓取预算", () => {
    const urls = marketingEntries(BASE, NOW).map((e) => e.url);
    expect(urls).not.toContain(`${BASE}/templates`);
    expect(urls).not.toContain(`${BASE}/zh/templates`);
  });

  it("不产生重复 URL", () => {
    const urls = marketingEntries(BASE, NOW).map((e) => e.url);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it("首页英文侧优先级最高", () => {
    const entries = marketingEntries(BASE, NOW);
    const home = entries.find((e) => e.url === `${BASE}/`);
    expect(home?.priority).toBe(1);
  });
});

describe("localizedDetailEntries", () => {
  it("每条详情页出双语两条并互挂 hreflang", () => {
    const entries = localizedDetailEntries(BASE, [
      { routePath: "/templates/skincare", lastModified: NOW },
    ]);
    expect(entries.map((e) => e.url)).toEqual([
      `${BASE}/templates/skincare`,
      `${BASE}/zh/templates/skincare`,
    ]);
    for (const e of entries) {
      expect(e.alternates?.languages).toEqual({
        en: `${BASE}/templates/skincare`,
        "zh-Hans": `${BASE}/zh/templates/skincare`,
      });
    }
  });

  it("未进入 LOCALIZED_PREFIXES 的路径会产生重复 URL——用断言暴露该误用", () => {
    // localePath 对未登记前缀原样返回，两条 URL 相同：调用方必须先把前缀加进清单。
    const entries = localizedDetailEntries(BASE, [{ routePath: "/changelog/foo", lastModified: NOW }]);
    expect(new Set(entries.map((e) => e.url)).size).toBe(1);
  });

  it("NOINDEX_PATHS 的详情页只出未被判弱的那一侧", () => {
    // 英文侧在名单里、中文侧不在：只出中文一条，且 hreflang 不挂英文侧。
    const phoneCase = localizedDetailEntries(BASE, [
      { routePath: "/templates/phone-case", lastModified: NOW },
    ]);
    expect(phoneCase.map((e) => e.url)).toEqual([`${BASE}/zh/templates/phone-case`]);
    expect(phoneCase[0].alternates?.languages).toEqual({
      "zh-Hans": `${BASE}/zh/templates/phone-case`,
    });
    // 两侧都在名单里：一条都不出。
    const plusSize = localizedDetailEntries(BASE, [
      { routePath: "/templates/plus-size", lastModified: NOW },
    ]);
    expect(plusSize).toEqual([]);
    // 行业页同理：supplement 英文侧不出，中文侧照常出。
    const supplement = localizedDetailEntries(BASE, [
      { routePath: "/templates/industry/supplement", lastModified: NOW },
    ]);
    expect(supplement.map((e) => e.url)).toEqual([`${BASE}/zh/templates/industry/supplement`]);
  });

  it("不在 NOINDEX_PATHS 里的详情页照常出双语两条", () => {
    const entries = localizedDetailEntries(BASE, [
      { routePath: "/templates/skincare", lastModified: NOW },
    ]);
    expect(entries.map((e) => e.url)).toEqual([
      `${BASE}/templates/skincare`,
      `${BASE}/zh/templates/skincare`,
    ]);
  });
});
