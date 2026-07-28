import { describe, it, expect } from "vitest";
import { filterTemplates, facetOptions, archetypeLabel, categoryLabel } from "./templateFilter";
import type { TemplateMeta } from "./registry";
import { TEMPLATES } from "./registry";

const M = (over: Partial<TemplateMeta> & Pick<TemplateMeta, "id">): TemplateMeta => ({
  id: over.id,
  name: over.name ?? "Name",
  industry: over.industry ?? { en: "Industry", zh: "行业" },
  tagline: over.tagline ?? { en: "Tagline", zh: "简介" },
  thumbnail: "",
  tier: over.tier ?? "t1",
  tags: {
    category: over.tags?.category ?? "beauty",
    subcategory: over.tags?.subcategory ?? "skincare",
    archetype: over.tags?.archetype ?? "seeding",
    conversion: over.tags?.conversion ?? ["whatsapp"],
    risk: over.tags?.risk ?? "low",
    tone: over.tags?.tone ?? "emotional",
  },
});

const metas: TemplateMeta[] = [
  M({ id: "a", name: "Aurae Skincare", tags: { category: "beauty", archetype: "seeding", conversion: ["whatsapp"] } as TemplateMeta["tags"] }),
  M({
    id: "b",
    name: "Solterra Solar",
    tagline: { en: "Home solar", zh: "太阳能" },
    tags: { category: "home-improvement", archetype: "consult", conversion: ["whatsapp", "form"] } as TemplateMeta["tags"],
  }),
  M({ id: "c", name: "Atlas Footwear", tags: { category: "apparel", archetype: "seeding", conversion: ["whatsapp"] } as TemplateMeta["tags"] }),
];

describe("filterTemplates", () => {
  it("空筛选返回全部", () => {
    expect(filterTemplates(metas, {})).toHaveLength(3);
  });
  it("按行业 category 过滤", () => {
    expect(filterTemplates(metas, { category: "apparel" }).map((m) => m.id)).toEqual(["c"]);
  });
  it("按范式 archetype 过滤（数据键为英文 slug）", () => {
    expect(filterTemplates(metas, { archetype: "consult" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("按转化方式命中数组任一", () => {
    expect(filterTemplates(metas, { conversion: "form" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("三维 AND", () => {
    expect(filterTemplates(metas, { category: "beauty", archetype: "consult" })).toHaveLength(0);
  });
  it("query 按当前语言的可见文案匹配", () => {
    expect(filterTemplates(metas, { query: "solar" }, "en").map((m) => m.id)).toEqual(["b"]);
    expect(filterTemplates(metas, { query: "太阳能" }, "zh").map((m) => m.id)).toEqual(["b"]);
  });
  it("query 不匹配另一语言的隐藏文案——搜到看不见的文字无法解释", () => {
    expect(filterTemplates(metas, { query: "太阳能" }, "en")).toHaveLength(0);
  });
});

describe("facetOptions", () => {
  it("仅列实际出现的值并按 locale 附展示名", () => {
    const zh = facetOptions(metas, "zh");
    expect(zh.category).toContainEqual({ value: "apparel", label: "服饰配饰" });
    expect(zh.conversion).toContainEqual({ value: "form", label: "表单" });
    expect(zh.archetype).toContainEqual({ value: "consult", label: "预约咨询" });

    const en = facetOptions(metas, "en");
    expect(en.category).toContainEqual({ value: "apparel", label: "Apparel & accessories" });
    expect(en.archetype).toContainEqual({ value: "consult", label: "Booking inquiry" });
  });
  it("去重：beauty 只出现一次", () => {
    expect(facetOptions(metas).category.filter((o) => o.value === "beauty")).toHaveLength(1);
  });
});

describe("标签映射对真实注册表的覆盖", () => {
  it("每个 category 与 archetype 都有两种语言的展示名，不回退成裸 slug", () => {
    for (const locale of ["en", "zh"] as const) {
      for (const t of TEMPLATES) {
        expect(categoryLabel(locale, t.tags.category), `${locale}/${t.tags.category}`).not.toBe(
          t.tags.category,
        );
        expect(archetypeLabel(locale, t.tags.archetype), `${locale}/${t.tags.archetype}`).not.toBe(
          t.tags.archetype,
        );
      }
    }
  });

  it("每套模板的双语文案都非空", () => {
    for (const t of TEMPLATES) {
      for (const locale of ["en", "zh"] as const) {
        expect(t.industry[locale].trim(), `${t.id}.industry.${locale}`).not.toBe("");
        expect(t.tagline[locale].trim(), `${t.id}.tagline.${locale}`).not.toBe("");
        if (t.seoIntro) {
          expect(t.seoIntro[locale].trim(), `${t.id}.seoIntro.${locale}`).not.toBe("");
        }
      }
    }
  });
});
