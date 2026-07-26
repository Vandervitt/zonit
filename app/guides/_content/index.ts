import type { GuideArticle } from "./types";
import { facebookAdLandingPageCompliance } from "./articles/facebook-ad-landing-page-compliance";
import { whatsappLeadLandingPage } from "./articles/whatsapp-lead-landing-page";
import { landingPageConversionAttribution } from "./articles/landing-page-conversion-attribution";

/** 列表顺序即展示顺序（新文放前，突出新鲜度）。 */
export const GUIDES: GuideArticle[] = [
  facebookAdLandingPageCompliance,
  whatsappLeadLandingPage,
  landingPageConversionAttribution,
];

export function getGuide(slug: string): GuideArticle | undefined {
  return GUIDES.find((g) => g.slug === slug);
}

/** 抽取文章内所有 faq 块的问答，供 FAQPage 结构化数据使用。 */
export function guideFaqItems(article: GuideArticle): { q: string; a: string }[] {
  return article.sections.flatMap((s) =>
    s.blocks.flatMap((b) => (b.t === "faq" ? b.items : [])),
  );
}
