import { describe, it, expect } from "vitest";
import { filterTemplates, facetOptions } from "./templateFilter";
import type { TemplateMeta } from "./registry";

const M = (over: Partial<TemplateMeta> & Pick<TemplateMeta, "id">): TemplateMeta => ({
  id: over.id,
  name: over.name ?? "Name",
  industry: over.industry ?? "行业",
  tagline: over.tagline ?? "简介",
  thumbnail: "",
  tier: over.tier ?? "t1",
  tags: {
    category: over.tags?.category ?? "beauty",
    subcategory: over.tags?.subcategory ?? "skincare",
    archetype: over.tags?.archetype ?? "种草留资",
    conversion: over.tags?.conversion ?? ["whatsapp"],
    risk: over.tags?.risk ?? "low",
    tone: over.tags?.tone ?? "emotional",
  },
});

const metas: TemplateMeta[] = [
  M({ id: "a", name: "Aurae Skincare", tags: { category: "beauty", archetype: "种草留资", conversion: ["whatsapp"] } as TemplateMeta["tags"] }),
  M({ id: "b", name: "Solterra Solar", tagline: "太阳能", tags: { category: "home-improvement", archetype: "预约咨询", conversion: ["whatsapp", "form"] } as TemplateMeta["tags"] }),
  M({ id: "c", name: "Atlas Footwear", tags: { category: "apparel", archetype: "种草留资", conversion: ["whatsapp"] } as TemplateMeta["tags"] }),
];

describe("filterTemplates", () => {
  it("空筛选返回全部", () => {
    expect(filterTemplates(metas, {})).toHaveLength(3);
  });
  it("按行业 category 过滤", () => {
    expect(filterTemplates(metas, { category: "apparel" }).map((m) => m.id)).toEqual(["c"]);
  });
  it("按范式 archetype 过滤", () => {
    expect(filterTemplates(metas, { archetype: "预约咨询" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("按转化方式命中数组任一", () => {
    expect(filterTemplates(metas, { conversion: "form" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("三维 AND", () => {
    expect(filterTemplates(metas, { category: "beauty", archetype: "预约咨询" })).toHaveLength(0);
  });
  it("query 对 name/tagline/industry 不区分大小写子串匹配", () => {
    expect(filterTemplates(metas, { query: "solar" }).map((m) => m.id)).toEqual(["b"]);
    expect(filterTemplates(metas, { query: "太阳能" }).map((m) => m.id)).toEqual(["b"]);
  });
  it("facetOptions 仅列实际出现的值并附中文标签", () => {
    const opts = facetOptions(metas);
    expect(opts.category).toContainEqual({ value: "apparel", label: "服饰配饰" });
    expect(opts.conversion).toContainEqual({ value: "form", label: "表单" });
    // 去重：beauty 只出现一次
    expect(opts.category.filter((o) => o.value === "beauty")).toHaveLength(1);
  });
});
