import { describe, it, expect } from "vitest";
import { marketingEntries } from "./sitemap-entries";
import { LOCALIZED_ROUTES } from "@/lib/i18n/routes";

const BASE = "https://zapbridge.tech";
const NOW = new Date("2026-07-27T00:00:00Z");

describe("marketingEntries", () => {
  it("已国际化路由输出双语两条", () => {
    const urls = marketingEntries(BASE, NOW).map((e) => e.url);
    for (const route of LOCALIZED_ROUTES) {
      const en = route === "/" ? `${BASE}/` : `${BASE}${route}`;
      const zh = route === "/" ? `${BASE}/zh` : `${BASE}/zh${route}`;
      expect(urls).toContain(en);
      expect(urls).toContain(zh);
    }
  });

  it("双语条目都带 en / zh-Hans 两个 alternates", () => {
    const entries = marketingEntries(BASE, NOW);
    const expected = { en: `${BASE}/`, "zh-Hans": `${BASE}/zh` };
    expect(entries.find((e) => e.url === `${BASE}/`)?.alternates?.languages).toEqual(expected);
    expect(entries.find((e) => e.url === `${BASE}/zh`)?.alternates?.languages).toEqual(expected);
  });

  it("尚未国际化的营销页只出英文侧单条，不伪造 /zh 链接", () => {
    const urls = marketingEntries(BASE, NOW).map((e) => e.url);
    expect(urls).toContain(`${BASE}/templates`);
    expect(urls).toContain(`${BASE}/guides`);
    expect(urls).not.toContain(`${BASE}/zh/templates`);
    expect(urls).not.toContain(`${BASE}/zh/guides`);
  });

  it("尚未国际化的条目不带 alternates", () => {
    const entries = marketingEntries(BASE, NOW);
    expect(entries.find((e) => e.url === `${BASE}/templates`)?.alternates).toBeUndefined();
  });

  it("PR 2 上线的页面出双语两条并互挂 hreflang", () => {
    const entries = marketingEntries(BASE, NOW);
    const urls = entries.map((e) => e.url);
    for (const route of ["/pricing", "/anti-ban", "/login", "/register"]) {
      expect(urls).toContain(`${BASE}${route}`);
      expect(urls).toContain(`${BASE}/zh${route}`);
      expect(entries.find((e) => e.url === `${BASE}${route}`)?.alternates?.languages).toEqual({
        en: `${BASE}${route}`,
        "zh-Hans": `${BASE}/zh${route}`,
      });
    }
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
