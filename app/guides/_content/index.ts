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
import { landingPageDuplicateDetection as dupZh } from "./articles/landing-page-duplicate-detection/zh";
import { landingPageDuplicateDetection as dupEn } from "./articles/landing-page-duplicate-detection/en";
import { adAccountBanLandingPageAudit as banZh } from "./articles/ad-account-ban-landing-page-audit/zh";
import { adAccountBanLandingPageAudit as banEn } from "./articles/ad-account-ban-landing-page-audit/en";
import { tiktokLandingPageCompliance as ttZh } from "./articles/tiktok-landing-page-compliance/zh";
import { tiktokLandingPageCompliance as ttEn } from "./articles/tiktok-landing-page-compliance/en";
import { googleAdsLandingPagePolicy as gadsZh } from "./articles/google-ads-landing-page-policy/zh";
import { googleAdsLandingPagePolicy as gadsEn } from "./articles/google-ads-landing-page-policy/en";
import { landingPagePrivacyPolicyFooter as privZh } from "./articles/landing-page-privacy-policy-footer/zh";
import { landingPagePrivacyPolicyFooter as privEn } from "./articles/landing-page-privacy-policy-footer/en";
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
import { supplementLeadGenerationCompliance as suppZh } from "./articles/supplement-lead-generation-compliance/zh";
import { supplementLeadGenerationCompliance as suppEn } from "./articles/supplement-lead-generation-compliance/en";
import { babyToyLeadGeneration as toysZh } from "./articles/baby-toy-lead-generation/zh";
import { babyToyLeadGeneration as toysEn } from "./articles/baby-toy-lead-generation/en";
import { b2bRfqLeadGeneration as b2bZh } from "./articles/b2b-rfq-lead-generation/zh";
import { b2bRfqLeadGeneration as b2bEn } from "./articles/b2b-rfq-lead-generation/en";
import { educationEnrolmentLeadGeneration as eduZh } from "./articles/education-enrolment-lead-generation/zh";
import { educationEnrolmentLeadGeneration as eduEn } from "./articles/education-enrolment-lead-generation/en";
import { immigrationFirmLeadGeneration as legalZh } from "./articles/immigration-firm-lead-generation/zh";
import { immigrationFirmLeadGeneration as legalEn } from "./articles/immigration-firm-lead-generation/en";
import { localServiceLeadGeneration as localZh } from "./articles/local-service-lead-generation/zh";
import { localServiceLeadGeneration as localEn } from "./articles/local-service-lead-generation/en";

/**
 * 列表顺序即展示顺序（新文放前，突出新鲜度）。
 * 长文属内容而非界面字符串，故不进字典，按语言分文件放在 articles/<slug>/{en,zh}.ts；
 * 两种语言共用同一 slug，使 hreflang 配对无需额外映射表。
 */
const GUIDES_BY_LOCALE: Record<Locale, GuideArticle[]> = {
  en: [dupEn, banEn, ttEn, gadsEn, privEn, beautyEn, clinicEn, solarEn, apparelEn, gadgetEn, homeEn, suppEn, toysEn, b2bEn, eduEn, legalEn, localEn, xbEn, fbEn, waEn, attrEn],
  zh: [dupZh, banZh, ttZh, gadsZh, privZh, beautyZh, clinicZh, solarZh, apparelZh, gadgetZh, homeZh, suppZh, toysZh, b2bZh, eduZh, legalZh, localZh, xbZh, fbZh, waZh, attrZh],
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
