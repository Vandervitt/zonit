// lib/seo/landing-jsonld.ts
// 租户落地页（/p/[slug]，客户自有域名）结构化数据：从落地页 schema 派生
// FAQPage 与 Organization JSON-LD，用于 SEO 富媒体与 GEO（被 AI 摘要引用）。
// 注入的是「客户品牌 + 客户域名」实体，绝不使用平台 Zap Bridge 实体。
// 合规：schema 无评分字段，故不产出 Review/AggregateRating（不伪造评分）。
import type { LandingPageDraft, LandingSection } from "@/types/schema.draft";

type FaqSectionEntry = Extract<LandingSection, { type: "faq" }>;

/** FAQPage：从 faq 区块映射；无区块或无有效问答则返回 null。 */
export function landingFaqJsonLd(data: LandingPageDraft): Record<string, unknown> | null {
  const faq = data.sections.find((s): s is FaqSectionEntry => s.type === "faq");
  if (!faq) return null;
  const items = faq.data.items.filter((it) => it.question?.trim() && it.answer?.trim());
  if (items.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  };
}

/**
 * Organization：租户品牌实体（品牌名 + 页面地址 + 可选 logo/邮箱）；无品牌名则返回 null。
 *
 * `pageUrl` 传该页的 canonical，而非域名根：多路径发布后客户可能只发了
 * /invisalign 而没发根路径，把 Organization.url 指向根就是指向一个 404。
 */
export function landingOrganizationJsonLd(
  data: LandingPageDraft,
  pageUrl: string,
): Record<string, unknown> | null {
  const name = data.footer.brandName?.trim();
  if (!name) return null;
  const org: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url: pageUrl,
  };
  const logo = data.branding?.logo ?? data.branding?.favicon;
  if (logo) org.logo = logo;
  const email = data.contact.email?.trim();
  if (email) org.email = email;
  return org;
}
