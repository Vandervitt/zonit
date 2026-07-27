// lib/seo/template-content.ts
// 模板详情页 SEO 内容化：从模板元数据 + 真实样稿派生「简介 / 包含板块 / 适合谁 /
// 使用步骤 / 常见问题」等编辑型内容，并生成 BreadcrumbList、FAQPage 结构化数据。
// 大部分内容由数据自动派生（每页天然不同）；真正独特的首段来自模板的 seoIntro。
import type { TemplateMeta } from "@/landing-editor/samples/registry";
import type { LandingPageDraft, LandingSectionType } from "@/types/schema.draft";
import { SECTION_REGISTRY } from "@/types/schema.draft";
import { CONVERSION_LABELS } from "@/landing-editor/samples/templateFilter";
import { Routes, templateDetailPath } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo/site";

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

/** 转化方式中文短语，如 "WhatsApp / 表单"。 */
export function conversionText(t: TemplateMeta): string {
  return t.tags.conversion.map((c) => CONVERSION_LABELS[c] ?? c).join(" / ");
}

/** 从真实样稿提取「包含哪些板块」中文标签（固定首屏 + 中部区块 + 留资表单）。 */
export function includedSections(draft: LandingPageDraft): string[] {
  const mid = draft.sections
    .map((s) => SECTION_REGISTRY[s.type as LandingSectionType]?.label)
    .filter((label): label is string => Boolean(label));
  const parts = ["首屏主视觉", ...mid];
  if (draft.leadForm) parts.push("留资表单");
  return Array.from(new Set(parts));
}

/** 模板简介：seoIntro 优先，未写独特文案时由标签派生兜底（不至于空白）。 */
export function templateIntro(t: TemplateMeta): string {
  const custom = t.seoIntro?.trim();
  if (custom) return custom;
  return `${t.name} 是一套面向「${t.industry}」的${t.tags.archetype}落地页模板，访客通过 ${conversionText(
    t,
  )} 完成留资咨询。投放级结构、合规页脚开箱即用，选用后改内容、绑定你自己的品牌域名即可发布。`;
}

/** 组装模板详情页的全部编辑型内容。 */
export function buildTemplateSeoContent(t: TemplateMeta, draft: LandingPageDraft): TemplateSeoContent {
  const conv = conversionText(t);
  return {
    intro: templateIntro(t),
    whoFor: `适合做「${t.industry}」出海获客、以 ${conv} 承接线索的广告主与代运营团队；尤其契合${t.tags.archetype}场景。`,
    included: includedSections(draft),
    howToUse: [
      { step: "选用模板", detail: `点击「用这个模板开始」，${t.name} 会作为初始草稿载入编辑器。` },
      { step: "改内容 · 绑域名", detail: "替换文案、图片与卖点，配置 CTA 与留资表单，绑定你自己的品牌域名。" },
      { step: "发布投放", detail: "一键发布，平台自动配好 DNS 与 HTTPS 证书；接入像素与转化回传后即可投放引流。" },
    ],
    faqs: [
      {
        q: `${t.name} 模板可以随意修改吗？`,
        a: "可以。文案、图片、配色与板块顺序都能在可视化编辑器里替换，改成你自己的品牌与卖点，全程无需写代码。",
      },
      {
        q: "访客怎么联系我、怎么留资？",
        a: `这套模板通过 ${conv} 收集线索：访客点击落地页上的 CTA 即发起 ${conv} 咨询或提交表单，线索会进入你的后台线索列表。`,
      },
      {
        q: "发布到自己的域名复杂吗？",
        a: "不复杂。选用模板改好内容后绑定你自己的品牌域名，平台自动配置 DNS 与 HTTPS 证书，几分钟即可上线投放。",
      },
      {
        q: "用这套模板做广告投放合规吗？",
        a: "模板内置合规页脚（隐私政策 / 服务条款入口）并保持非交易的获客属性；Agency 套餐还提供反同质化风控，降低同模板页面被投放平台判重的概率。",
      },
    ],
  };
}

/** BreadcrumbList 结构化数据（与页面面包屑一致）。 */
export function templateBreadcrumbJsonLd(t: TemplateMeta): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "模板库", item: absoluteUrl(Routes.Templates) },
      { "@type": "ListItem", position: 2, name: t.industry },
      { "@type": "ListItem", position: 3, name: t.name, item: absoluteUrl(templateDetailPath(t.id)) },
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
