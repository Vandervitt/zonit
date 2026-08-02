// lib/seo/guides-industry.test.ts
// 行业获客文（内容营销簇 D）与行业中间层的双向内链契约。
//
// 这套内链是簇 D 存在的理由：「行业文 → 行业页 → 模板页」。少一个方向，
// 文章就只是一篇孤立的博客；两边都在，才构成漏斗。以下断言把它钉住。
import { describe, it, expect } from "vitest";
import { getGuides, getGuideForIndustry, GUIDE_SLUGS } from "@/app/guides/_content";
import { industryCategories } from "@/lib/templates/industries";
import { locales } from "@/lib/i18n/config";

describe("行业获客文覆盖", () => {
  it.each(locales)("%s 每个行业都有对应的获客文", (locale) => {
    for (const category of industryCategories()) {
      const guide = getGuideForIndustry(locale, category);
      expect(guide, `行业 ${category} 缺获客文`).toBeTruthy();
    }
  });

  it.each(locales)("%s 一个行业只挂一篇文章（多篇会让反向内链变得随机）", (locale) => {
    const counts = new Map<string, number>();
    for (const g of getGuides(locale)) {
      if (!g.industry) continue;
      counts.set(g.industry, (counts.get(g.industry) ?? 0) + 1);
    }
    for (const [category, n] of counts) {
      expect(n, `行业 ${category} 挂了 ${n} 篇`).toBe(1);
    }
  });

  it.each(locales)("%s 文章声明的 industry 必须是注册表里真实存在的行业", (locale) => {
    const valid = new Set(industryCategories());
    for (const g of getGuides(locale)) {
      if (!g.industry) continue;
      expect(valid.has(g.industry), `${g.slug} 的 industry="${g.industry}" 不存在`).toBe(true);
    }
  });

  it("中英文的 slug 集合与行业归属完全一致（hreflang 靠同 slug 配对）", () => {
    const en = getGuides("en").map((g) => `${g.slug}:${g.industry ?? ""}`).sort();
    const zh = getGuides("zh").map((g) => `${g.slug}:${g.industry ?? ""}`).sort();
    expect(zh).toEqual(en);
  });
});

describe("行业获客文内容质量", () => {
  it.each(locales)("%s 每篇都有实质结构，不是占位空壳", (locale) => {
    // 中文单字信息量高于英文单词，按字符数一刀切会把合格的中文判为过短。
    const minIntro = locale === "zh" ? 60 : 100;
    for (const g of getGuides(locale)) {
      expect(g.sections.length, `${g.slug} 章节数`).toBeGreaterThanOrEqual(3);
      expect(g.intro.length, `${g.slug} 导语长度`).toBeGreaterThan(minIntro);
      expect(g.description.length, `${g.slug} 描述不得为空`).toBeGreaterThan(20);
      for (const s of g.sections) {
        expect(s.blocks.length, `${g.slug}#${s.id} 空章节`).toBeGreaterThan(0);
      }
    }
  });

  it.each(locales)("%s 每篇都带 FAQ 块（供 FAQPage 结构化数据抽取）", (locale) => {
    for (const g of getGuides(locale)) {
      const hasFaq = g.sections.some((s) => s.blocks.some((b) => b.t === "faq"));
      expect(hasFaq, `${g.slug} 缺 faq 块`).toBe(true);
    }
  });

  it.each(locales)("%s 各篇标题与导语互不重复（12 篇不得共用骨架）", (locale) => {
    const titles = getGuides(locale).map((g) => g.title);
    const intros = getGuides(locale).map((g) => g.intro);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(intros).size).toBe(intros.length);
  });

  it("slug 唯一且为 URL 安全的小写短横线格式", () => {
    expect(new Set(GUIDE_SLUGS).size).toBe(GUIDE_SLUGS.length);
    for (const slug of GUIDE_SLUGS) expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

// ---- 投放合规簇（簇 A）----
// 这一簇面向投手与代运营，不属于任何行业，落点是 /anti-ban 而非行业页。
// 它与行业文是两条互斥的 CTA 路径，混淆会把读完防封文的人丢进模板库。
describe("投放合规簇的 CTA 落点", () => {
  it("合规簇文章不挂 industry，且显式指向 anti-ban", () => {
    for (const locale of locales) {
      const compliance = getGuides(locale).filter((g) => g.ctaTarget === "anti-ban");
      expect(compliance.length, `${locale} 合规簇文章数`).toBeGreaterThanOrEqual(5);
      for (const g of compliance) {
        expect(g.industry, `${g.slug} 不应同时挂 industry`).toBeUndefined();
      }
    }
  });

  it("industry 与 ctaTarget 互斥——同时设置会让落点无从判断", () => {
    for (const locale of locales) {
      for (const g of getGuides(locale)) {
        expect(
          Boolean(g.industry) && Boolean(g.ctaTarget),
          `${g.slug} 同时设置了 industry 与 ctaTarget`,
        ).toBe(false);
      }
    }
  });

  it.each(locales)("%s 合规簇每篇都带经核实的官方政策来源", (locale) => {
    for (const g of getGuides(locale).filter((x) => x.ctaTarget === "anti-ban")) {
      expect(g.references?.length, `${g.slug} 缺参考资料`).toBeGreaterThanOrEqual(2);
      for (const r of g.references ?? []) {
        expect(r.url, `${g.slug} 的来源须为 https 官方地址`).toMatch(/^https:\/\//);
      }
    }
  });
});
