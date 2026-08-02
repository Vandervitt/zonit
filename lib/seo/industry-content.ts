// lib/seo/industry-content.ts
// 行业中间层的内容与结构化数据。
//
// 与 template-content.ts 的分工：那边是「从模板元数据派生」，靠句式模板铺满 52 页；
// 这边是「按行业手写」——12 个行业各写各的，故本模块只做取用与占位符替换，
// 不提供任何跨行业通用句式（那正是要避免的东西，见 industry-content.test.ts）。
import type { IndustryCopy } from "@/lib/i18n/dictionaries/en/templateIndustry";
import { templatesInIndustry } from "@/lib/templates/industries";
import { Routes, templateDetailPath, templateIndustryPath } from "@/lib/constants";
import { absoluteUrl } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

export type IndustrySeoContent = IndustryCopy & { category: string; count: number };

function copyOf(category: string, locale: Locale): IndustryCopy | null {
  const byCategory = getDictionary(locale).templateIndustry.byCategory as Record<string, IndustryCopy>;
  return byCategory[category] ?? null;
}

/** 行业展示名（复用模板画廊的行业标签，避免同一行业两处命名漂移）。 */
export function industryLabel(category: string, locale: Locale): string {
  const labels = getDictionary(locale).templates.category as Record<string, string>;
  return labels[category] ?? category;
}

/** 组装行业页文案；未知行业返回 null 供路由 404。 */
export function buildIndustrySeoContent(category: string, locale: Locale): IndustrySeoContent | null {
  const copy = copyOf(category, locale);
  if (!copy) return null;
  const count = String(templatesInIndustry(category).length);
  const fill = (s: string) => s.replaceAll("{count}", count);
  return {
    ...copy,
    category,
    count: Number(count),
    metaTitle: fill(copy.metaTitle),
    metaDescription: fill(copy.metaDescription),
    h1: fill(copy.h1),
    lead: fill(copy.lead),
    intro: copy.intro.map(fill),
    whoFor: fill(copy.whoFor),
    leadsArrive: fill(copy.leadsArrive),
    faqs: copy.faqs.map((f) => ({ q: fill(f.q), a: fill(f.a) })),
  };
}

/** 该行业模板数的展示量词（英文需区分单复数）。 */
export function industryCountLabel(count: number, locale: Locale): string {
  const l = getDictionary(locale).templateIndustry.shared.countLabel;
  return (count === 1 ? l.one : l.other).replaceAll("{count}", String(count));
}

/** 行业页面包屑：模板库 → 行业。 */
export function industryBreadcrumbJsonLd(
  category: string,
  locale: Locale,
): Record<string, unknown> | null {
  if (!copyOf(category, locale)) return null;
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: getDictionary(locale).templateIndustry.shared.breadcrumbRoot,
        item: absoluteUrl(localePath(locale, Routes.Templates)),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: industryLabel(category, locale),
        item: absoluteUrl(localePath(locale, templateIndustryPath(category))),
      },
    ],
  };
}

/** 行业页 ItemList：告诉搜索引擎这一页是该行业模板的集合页，而非又一张详情页。 */
export function industryItemListJsonLd(
  category: string,
  locale: Locale,
): Record<string, unknown> | null {
  const items = templatesInIndustry(category);
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: industryLabel(category, locale),
    numberOfItems: items.length,
    itemListElement: items.map((t, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: t.name,
      url: absoluteUrl(localePath(locale, templateDetailPath(t.id))),
    })),
  };
}
