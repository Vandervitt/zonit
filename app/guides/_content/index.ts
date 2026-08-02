import type { GuideArticle } from "./types";
import type { Locale } from "@/lib/i18n/config";
import { facebookAdLandingPageCompliance as fbZh } from "./articles/facebook-ad-landing-page-compliance/zh";
import { facebookAdLandingPageCompliance as fbEn } from "./articles/facebook-ad-landing-page-compliance/en";
import { whatsappLeadLandingPage as waZh } from "./articles/whatsapp-lead-landing-page/zh";
import { whatsappLeadLandingPage as waEn } from "./articles/whatsapp-lead-landing-page/en";
import { landingPageConversionAttribution as attrZh } from "./articles/landing-page-conversion-attribution/zh";
import { landingPageConversionAttribution as attrEn } from "./articles/landing-page-conversion-attribution/en";
import { crossBorderLeadGeneration as xbZh } from "./articles/cross-border-lead-generation/zh";
import { crossBorderLeadGeneration as xbEn } from "./articles/cross-border-lead-generation/en";
import { beautyBrandLeadGeneration as beautyZh } from "./articles/beauty-brand-lead-generation/zh";
import { beautyBrandLeadGeneration as beautyEn } from "./articles/beauty-brand-lead-generation/en";
import { clinicPatientLeadGeneration as clinicZh } from "./articles/clinic-patient-lead-generation/zh";
import { clinicPatientLeadGeneration as clinicEn } from "./articles/clinic-patient-lead-generation/en";
import { solarInstallerLeadGeneration as solarZh } from "./articles/solar-installer-lead-generation/zh";
import { solarInstallerLeadGeneration as solarEn } from "./articles/solar-installer-lead-generation/en";
import { apparelFitLeadGeneration as apparelZh } from "./articles/apparel-fit-lead-generation/zh";
import { apparelFitLeadGeneration as apparelEn } from "./articles/apparel-fit-lead-generation/en";
import { consumerTechLeadGeneration as gadgetZh } from "./articles/consumer-tech-lead-generation/zh";
import { consumerTechLeadGeneration as gadgetEn } from "./articles/consumer-tech-lead-generation/en";
import { homeGoodsLeadGeneration as homeZh } from "./articles/home-goods-lead-generation/zh";
import { homeGoodsLeadGeneration as homeEn } from "./articles/home-goods-lead-generation/en";

/**
 * 列表顺序即展示顺序（新文放前，突出新鲜度）。
 * 长文属内容而非界面字符串，故不进字典，按语言分文件放在 articles/<slug>/{en,zh}.ts；
 * 两种语言共用同一 slug，使 hreflang 配对无需额外映射表。
 */
const GUIDES_BY_LOCALE: Record<Locale, GuideArticle[]> = {
  en: [beautyEn, clinicEn, solarEn, apparelEn, gadgetEn, homeEn, xbEn, fbEn, waEn, attrEn],
  zh: [beautyZh, clinicZh, solarZh, apparelZh, gadgetZh, homeZh, xbZh, fbZh, waZh, attrZh],
};

export function getGuides(locale: Locale): GuideArticle[] {
  return GUIDES_BY_LOCALE[locale];
}

export function getGuide(locale: Locale, slug: string): GuideArticle | undefined {
  return GUIDES_BY_LOCALE[locale].find((g) => g.slug === slug);
}

/** slug 集合与语言无关（两种语言同 slug），供 generateStaticParams 与 sitemap 使用。 */
export const GUIDE_SLUGS: string[] = GUIDES_BY_LOCALE.en.map((g) => g.slug);

/** 该行业的获客指南（行业页反向内链用）；没有则返回 undefined。 */
export function getGuideForIndustry(locale: Locale, industry: string): GuideArticle | undefined {
  return GUIDES_BY_LOCALE[locale].find((g) => g.industry === industry);
}

/** 抽取文章内所有 faq 块的问答，供 FAQPage 结构化数据使用。 */
export function guideFaqItems(article: GuideArticle): { q: string; a: string }[] {
  return article.sections.flatMap((s) =>
    s.blocks.flatMap((b) => (b.t === "faq" ? b.items : [])),
  );
}
