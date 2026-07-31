import { describe, expect, it } from "vitest";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { fillTemplateCounts } from "./counts";
import { TEMPLATE_STATS, fillCounts, templateIndustries } from "./stats";

describe("TEMPLATE_STATS", () => {
  it("模板数与注册表条目数一致", () => {
    expect(TEMPLATE_STATS.templates).toBe(TEMPLATES.length);
  });

  it("行业数为 tags.category 去重计数", () => {
    const categories = new Set(TEMPLATES.map((t) => t.tags.category));
    expect(TEMPLATE_STATS.industries).toBe(categories.size);
  });

  it("模板库规模不应回落到营销文案里写死的旧口径", () => {
    // 文案曾长期停留在 "30+ 模板 / 只讲电商类目"。这条断言用于在模板被误删时报警。
    expect(TEMPLATE_STATS.templates).toBeGreaterThanOrEqual(40);
    expect(TEMPLATE_STATS.industries).toBeGreaterThanOrEqual(10);
  });
});

describe("templateIndustries", () => {
  it("行业条目数与去重口径一致，且各行业模板数之和等于模板总数", () => {
    const industries = templateIndustries();
    expect(industries).toHaveLength(TEMPLATE_STATS.industries);
    expect(industries.reduce((sum, x) => sum + x.count, 0)).toBe(TEMPLATE_STATS.templates);
  });

  it("每个行业至少有一套模板，且不重复", () => {
    const industries = templateIndustries();
    expect(industries.every((x) => x.count >= 1)).toBe(true);
    expect(new Set(industries.map((x) => x.category)).size).toBe(industries.length);
  });
});

describe("fillTemplateCounts", () => {
  it("替换两种占位符，且支持同一占位符多次出现", () => {
    const out = fillTemplateCounts("{templates} 套 / {industries} 行业 / 再来一次 {templates}", {
      templates: 48,
      industries: 12,
    });
    expect(out).toBe("48 套 / 12 行业 / 再来一次 48");
  });

  it("无占位符时原样返回", () => {
    expect(fillTemplateCounts("没有占位符", { templates: 48, industries: 12 })).toBe("没有占位符");
  });

  it("fillCounts 使用注册表真实口径", () => {
    expect(fillCounts("{templates}/{industries}")).toBe(
      `${TEMPLATES.length}/${TEMPLATE_STATS.industries}`,
    );
  });
});
