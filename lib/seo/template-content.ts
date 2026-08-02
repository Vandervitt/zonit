// lib/seo/template-content.ts
// 模板详情页 SEO 内容化：从模板元数据 + 真实样稿派生「简介 / 包含板块 / 适合谁 /
// 使用步骤 / 常见问题」等编辑型内容，并生成 BreadcrumbList、FAQPage 结构化数据。
// 大部分内容由数据自动派生（每页天然不同）；真正独特的首段来自模板的 seoIntro。
// 句式模板见 lib/i18n/dictionaries 下各语言的 templateContent.ts。
import type { TemplateMeta } from "@/landing-editor/samples/registry";
import type { LandingPageDraft, LandingSectionType } from "@/types/schema.draft";
import { SECTION_REGISTRY } from "@/types/schema.draft";
import { conversionLabel, archetypeLabel } from "@/landing-editor/samples/templateFilter";
import { Routes, templateDetailPath, templateIndustryPath } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo/site";
import { industryLabel } from "@/lib/seo/industry-content";
import { TEMPLATE_FAQS } from "@/lib/seo/template-seo-copy";
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
  /** 页面可见的全部问答（模板级在前，通用在后）。 */
  faqs: FaqQA[];
  /** 模板级独有问答——**只有这批**进 FAQPage 结构化数据。 */
  uniqueFaqs: FaqQA[];
  /** 通用问答（讲产品流程，全站相同）：可见但不进 schema。 */
  genericFaqs: FaqQA[];
}

/** 把 `{key}` 占位符替换为实际值。 */
function fill(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{(\w+)\}/g, (m, k) => vars[k] ?? m);
}

/**
 * 细分行业名：industry 字段形如 "Beauty / Skincare"，取斜杠后的细分段。
 * h1 用细分名而非大类名——搜索者搜的是 "skincare landing page template"，
 * 「Beauty / Skincare landing page template」既啰嗦又把词冲散了。
 */
export function subIndustryLabel(t: TemplateMeta, locale: Locale): string {
  const parts = t.industry[locale].split("/").map((s) => s.trim()).filter(Boolean);
  return parts[parts.length - 1] ?? t.industry[locale];
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

/**
 * 每套 seoIntro 的末句都是该模板的适用人群（"Made for ..." / "适合……"），
 * 52/52 双语齐全。拆出来当 whoFor，正文只留前半——同一段信息因此在页面上
 * 只出现一次，且 whoFor 从「全站一句通用句式」变成模板级独有。
 *
 * ⚠️ 这是按句式识别，属于名字依赖：新增模板若不带这个末句，whoFor 会静默回退到
 * 通用句式。由 template-content.test.ts 对全部模板断言拆分成功来兜住。
 */
const WHO_FOR_TAIL = {
  en: /(?:^|\s)((?:Made|Built|Designed) for [^.]*\.)\s*$/,
  zh: /(?:^|。)((?:适合|面向|适用于|专为)[^。]*。)\s*$/,
} as const;

export function splitSeoIntro(
  t: TemplateMeta,
  locale: Locale,
): { body: string; whoFor: string | null } {
  const raw = t.seoIntro?.[locale]?.trim();
  if (!raw) return { body: "", whoFor: null };
  const m = raw.match(WHO_FOR_TAIL[locale]);
  if (!m) return { body: raw, whoFor: null };
  return { body: raw.slice(0, m.index).trim(), whoFor: m[1].trim() };
}

/** 模板简介：seoIntro 正文（已去掉适用人群末句）；未写独特文案时由标签派生兜底。 */
export function templateIntro(t: TemplateMeta, locale: Locale): string {
  const { body } = splitSeoIntro(t, locale);
  if (body) return body;
  return fill(getDictionary(locale).templateContent.introFallback, {
    name: t.name,
    industry: t.industry[locale],
    archetype: archetypeLabel(locale, t.tags.archetype),
    conversion: conversionText(t, locale),
  });
}

/** 模板级独有问答（进 FAQPage 的唯一来源）。 */
export function templateUniqueFaqs(t: TemplateMeta, locale: Locale): FaqQA[] {
  return (TEMPLATE_FAQS[t.id] ?? []).map((f) => ({ q: f.q[locale], a: f.a[locale] }));
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
  const uniqueFaqs = templateUniqueFaqs(t, locale);
  const genericFaqs = d.faqs.map((f) => ({ q: fill(f.q, vars), a: fill(f.a, vars) }));
  return {
    intro: templateIntro(t, locale),
    // 模板级适用人群优先；缺末句时回退到通用句式，页面不至于空白。
    whoFor: splitSeoIntro(t, locale).whoFor ?? fill(d.whoFor, vars),
    included: includedSections(draft, locale),
    howToUse: d.howToUse.map((s) => ({ step: s.step, detail: fill(s.detail, vars) })),
    // 可见 FAQ = 模板级在前 + 通用在后；通用条目讲的是产品流程（能不能改、
    // 怎么发布），对访客仍然有用，只是不进结构化数据。
    uniqueFaqs,
    genericFaqs,
    faqs: [...uniqueFaqs, ...genericFaqs],
  };
}

/**
 * BreadcrumbList 结构化数据（与页面面包屑一致）：模板库 → 行业 → 模板。
 * 中间层原先被摘掉是因为「行业没有独立落地页」，无 item 的层级会被 Search Console
 * 判为「未填写字段 item」；行业页上线后该层有了真实 URL，故补回——三层面包屑
 * 同时把行业页的权重接进详情页，是这次中间层改造的主要内链通道之一。
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
        name: industryLabel(t.tags.category, locale),
        item: absoluteUrl(localePath(locale, templateIndustryPath(t.tags.category))),
      },
      {
        "@type": "ListItem",
        position: 3,
        name: t.name,
        item: absoluteUrl(localePath(locale, templateDetailPath(t.id))),
      },
    ],
  };
}

/**
 * FAQPage 结构化数据输出门槛。
 * 低于此数不输出——批量重复的 FAQPage 不会带来富媒体结果，只会让同一批问答
 * 在上百个页面上重复声明一遍。宁可没有结构化数据，也不要重复的结构化数据。
 */
export const MIN_FAQ_FOR_SCHEMA = 2;

/**
 * FAQPage 结构化数据（GEO：便于被 AI 摘要与富媒体结果引用）。
 * 传入的必须是**该页独有**的问答（详情页传 uniqueFaqs，行业页传行业 FAQ）；
 * 把通用问答喂进来会重新制造它要解决的问题。不足门槛返回 null，调用方不渲染。
 */
export function templateFaqJsonLd(faqs: FaqQA[]): Record<string, unknown> | null {
  if (faqs.length < MIN_FAQ_FOR_SCHEMA) return null;
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
