// lib/seo/template-content.ts
// 模板详情页 SEO 内容化：从模板元数据 + 真实样稿派生「简介 / 包含板块 / 适合谁 /
// 使用步骤 / 常见问题」等编辑型内容，并生成 BreadcrumbList、FAQPage 结构化数据。
// 大部分内容由数据自动派生（每页天然不同）；真正独特的首段来自模板的 seoIntro。
// 句式模板见 lib/i18n/dictionaries 下各语言的 templateContent.ts。
import type { TemplateMeta } from "@/landing-editor/samples/registry";
import type { LandingPageDraft, LandingSectionType } from "@/types/schema.draft";
import { SECTION_REGISTRY } from "@/types/schema.draft";
import { conversionLabel, archetypeLabel } from "@/landing-editor/samples/templateFilter";
import { Routes, templateDetailPath } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

export interface FaqQA {
  q: string;
  a: string;
}

export interface HowToStep {
  step: string;
  detail: string;
}

export interface TemplateSeoContent {
  intro: string;
  whoFor: string;
  included: string[];
  howToUse: HowToStep[];
  faqs: FaqQA[];
}

/** 把 `{key}` 占位符替换为实际值。 */
function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

/** 转化方式短语，如 "WhatsApp / Form"。 */
export function conversionText(t: TemplateMeta, locale: Locale): string {
  return t.tags.conversion.map((c) => conversionLabel(locale, c)).join(" / ");
}

/**
 * 从真实样稿提取「包含哪些板块」标签（固定首屏 + 中部区块 + 留资表单）。
 * SECTION_REGISTRY 的 label 目前只有中文，英文侧另有映射，缺键回退原 label。
 */
export function includedSections(draft: LandingPageDraft, locale: Locale): string[] {
  const t = getDictionary(locale).templateContent;
  const mid = draft.sections
    .map((s) => SECTION_REGISTRY[s.type as LandingSectionType]?.label)
    .filter((label): label is string => Boolean(label))
    .map((label) => t.sectionLabels[label] ?? label);
  const parts = [t.sectionHero, ...mid];
  if (draft.leadForm) parts.push(t.sectionLeadForm);
  return Array.from(new Set(parts));
}

/** 模板简介：seoIntro 优先，未写独特文案时由标签派生兜底（不至于空白）。 */
export function templateIntro(t: TemplateMeta, locale: Locale): string {
  const custom = t.seoIntro?.[locale]?.trim();
  if (custom) return custom;
  return fill(getDictionary(locale).templateContent.introFallback, {
    name: t.name,
    industry: t.industry[locale],
    archetype: archetypeLabel(locale, t.tags.archetype),
    conversion: conversionText(t, locale),
  });
}

/** 组装模板详情页的全部编辑型内容。 */
export function buildTemplateSeoContent(
  t: TemplateMeta,
  draft: LandingPageDraft,
  locale: Locale,
): TemplateSeoContent {
  const d = getDictionary(locale).templateContent;
  const vars = {
    name: t.name,
    industry: t.industry[locale],
    archetype: archetypeLabel(locale, t.tags.archetype),
    conversion: conversionText(t, locale),
  };
  return {
    intro: templateIntro(t, locale),
    whoFor: fill(d.whoFor, vars),
    included: includedSections(draft, locale),
    howToUse: d.howToUse.map((s) => ({ step: s.step, detail: fill(s.detail, vars) })),
    faqs: d.faqs.map((f) => ({ q: fill(f.q, vars), a: fill(f.a, vars) })),
  };
}

/**
 * BreadcrumbList 结构化数据（与页面面包屑一致）。
 * 只保留有真实 URL 的层级：行业没有独立落地页，作为无 item 的中间层会被
 * Search Console 判为「未填写字段 item」，故不进面包屑（行业文案仍展示在 h1 旁）。
 */
export function templateBreadcrumbJsonLd(t: TemplateMeta, locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: getDictionary(locale).templates.detail.breadcrumbRoot,
        item: absoluteUrl(localePath(locale, Routes.Templates)),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: t.name,
        item: absoluteUrl(localePath(locale, templateDetailPath(t.id))),
      },
    ],
  };
}

/** FAQPage 结构化数据（GEO：便于被 AI 摘要与富媒体结果引用）。 */
export function templateFaqJsonLd(faqs: FaqQA[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}
