// lib/seo/industry-content.test.ts
// 行业中间层的三条契约：
// ① 文案键集合与注册表行业实时对齐（加一个行业忘了写文案 → 立刻红）；
// ② 各行业文案必须互不雷同——这一层存在的全部意义就是「不同行业说不同的话」，
//    一旦退化成一套句式换名词，行业页会重蹈模板详情页的 near-duplicate 覆辙；
// ③ 结构化数据（面包屑 / ItemList）符合 Google 对 item URL 与层级的要求。
import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, it, expect } from "vitest";
import {
  buildIndustrySeoContent,
  industryBreadcrumbJsonLd,
  industryItemListJsonLd,
} from "@/lib/seo/industry-content";
import { templateBreadcrumbJsonLd } from "@/lib/seo/template-content";
import {
  industryCategories,
  indexableIndustryCategories,
  isIndexableIndustry,
  templatesInIndustry,
  INDEXABLE_MIN_TEMPLATES,
} from "@/lib/templates/industries";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { locales } from "@/lib/i18n/config";

interface ListItem {
  "@type": string;
  position: number;
  name: string;
  item?: string;
}

describe("行业文案覆盖", () => {
  it.each(locales)("%s 的 byCategory 键集合与注册表行业完全一致", (locale) => {
    const written = Object.keys(getDictionary(locale).templateIndustry.byCategory).sort();
    expect(written).toEqual([...industryCategories()].sort());
  });

  it.each(locales)("%s 每个行业都写了实质内容，没有占位空壳", (locale) => {
    const copy = getDictionary(locale).templateIndustry.byCategory;
    // 中文单字信息量高于英文单词，按字符数一刀切会把合格的中文答案判为过短。
    const minBody = locale === "zh" ? 80 : 120;
    const minAnswer = locale === "zh" ? 40 : 60;
    for (const [category, c] of Object.entries(copy)) {
      expect(c.intro.length, `${category} 正文段落数`).toBeGreaterThanOrEqual(2);
      expect(c.faqs.length, `${category} FAQ 条数`).toBeGreaterThanOrEqual(3);
      // 只保证「不是一句话敷衍」；具体篇幅由写作把控，阈值取得很松。
      const body = c.intro.join("");
      expect(body.length, `${category} 正文长度`).toBeGreaterThan(minBody);
      for (const f of c.faqs) {
        expect(f.a.length, `${category} FAQ「${f.q}」答案长度`).toBeGreaterThan(minAnswer);
      }
    }
  });
});

describe("行业文案差异化（本层的存在理由）", () => {
  it.each(locales)("%s 各行业的首段与开场白互不重复", (locale) => {
    const copy = Object.values(getDictionary(locale).templateIndustry.byCategory);
    for (const field of ["lead", "whoFor", "leadsArrive"] as const) {
      const values = copy.map((c) => c[field]);
      expect(new Set(values).size, `${field} 出现重复`).toBe(values.length);
    }
    const firstParagraphs = copy.map((c) => c.intro[0]);
    expect(new Set(firstParagraphs).size).toBe(firstParagraphs.length);
  });

  it.each(locales)("%s 各行业的 FAQ 问题不得跨行业照搬", (locale) => {
    const copy = Object.values(getDictionary(locale).templateIndustry.byCategory);
    const questions = copy.flatMap((c) => c.faqs.map((f) => f.q));
    // 允许极少量天然重合（如「能直接下单吗」在多个电商类行业都成立），
    // 但整体重复率必须很低——否则就是又写成了一套通用 FAQ。
    const unique = new Set(questions).size;
    expect(unique / questions.length).toBeGreaterThan(0.9);
  });
});

describe("buildIndustrySeoContent", () => {
  it("把 {count} 替换为该行业真实模板数", () => {
    for (const category of industryCategories()) {
      const seo = buildIndustrySeoContent(category, "en")!;
      const count = String(templatesInIndustry(category).length);
      expect(seo.metaTitle).not.toContain("{count}");
      expect(seo.lead).not.toContain("{count}");
      expect(`${seo.metaTitle}${seo.metaDescription}${seo.lead}`).toContain(count);
    }
  });

  it("未知行业返回 null，供路由 404", () => {
    expect(buildIndustrySeoContent("no-such-industry", "en")).toBeNull();
  });
});

describe("可索引门槛", () => {
  it("模板数不足门槛的行业不可索引，且不进 sitemap 候选", () => {
    for (const category of industryCategories()) {
      const enough = templatesInIndustry(category).length >= INDEXABLE_MIN_TEMPLATES;
      expect(isIndexableIndustry(category), category).toBe(enough);
    }
    expect(indexableIndustryCategories()).toEqual(
      industryCategories().filter(isIndexableIndustry),
    );
  });

  it("当前至少存在一个薄行业被挡住（门槛真的在生效）", () => {
    // 若将来所有行业都补齐到门槛以上，这条会红——那是好消息，届时删掉即可。
    expect(indexableIndustryCategories().length).toBeLessThan(industryCategories().length);
  });
});

describe("app/zh 镜像", () => {
  // 方案 B（镜像树）的固有风险是「加了营销页忘补中文镜像」，中文侧会直接 404。
  it("行业页英文与中文路由文件同时存在", () => {
    const root = join(process.cwd(), "app");
    expect(existsSync(join(root, "templates/industry/[category]/page.tsx"))).toBe(true);
    expect(existsSync(join(root, "zh/templates/industry/[category]/page.tsx"))).toBe(true);
  });
});

describe("结构化数据", () => {
  it.each(locales)("%s 行业面包屑两层且都带 item URL", (locale) => {
    for (const category of industryCategories()) {
      const list = industryBreadcrumbJsonLd(category, locale)!.itemListElement as ListItem[];
      expect(list).toHaveLength(2);
      list.forEach((li, i) => {
        expect(li.position).toBe(i + 1);
        expect(li.item, `${locale}/${category}`).toMatch(/^https?:\/\//);
      });
    }
  });

  it.each(locales)("%s 模板详情页面包屑升为三层：模板库 → 行业 → 模板", (locale) => {
    for (const t of TEMPLATES) {
      const list = templateBreadcrumbJsonLd(t, locale).itemListElement as ListItem[];
      expect(list, t.id).toHaveLength(3);
      expect(list[1].item, `${t.id} 行业层`).toContain(`/templates/industry/${t.tags.category}`);
      for (const li of list) expect(li.item).toMatch(/^https?:\/\//);
    }
  });

  it("ItemList 覆盖该行业全部模板并指向详情页", () => {
    for (const category of industryCategories()) {
      const jsonLd = industryItemListJsonLd(category, "en")!;
      const items = jsonLd.itemListElement as { position: number; url: string }[];
      expect(items).toHaveLength(templatesInIndustry(category).length);
      expect(jsonLd.numberOfItems).toBe(items.length);
      items.forEach((it, i) => {
        expect(it.position).toBe(i + 1);
        expect(it.url).toMatch(/^https?:\/\/.+\/templates\/[a-z0-9-]+$/);
      });
    }
  });

  it("中文行业页的结构化数据 URL 带 /zh 前缀，英文页不带", () => {
    const zh = industryItemListJsonLd("beauty", "zh")!.itemListElement as { url: string }[];
    const en = industryItemListJsonLd("beauty", "en")!.itemListElement as { url: string }[];
    for (const it of zh) expect(it.url).toContain("/zh/templates/");
    for (const it of en) expect(it.url).not.toMatch(/\/zh\//);
  });
});
