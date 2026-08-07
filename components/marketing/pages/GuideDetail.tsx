import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fonts } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, guideDetailPath, templateIndustryPath } from "@/lib/constants";
import { industryLabel } from "@/lib/seo/industry-content";
import { marketingMetadata, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { getGuides, getGuide, guideFaqItems, GUIDE_SLUGS } from "@/app/guides/_content";
import { GuideArticleView } from "@/app/guides/_components/GuideArticleView";
import type { GuideArticle } from "@/app/guides/_content/types";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { fillCounts } from "@/lib/templates/stats";
import { htmlLang, type Locale } from "@/lib/i18n/config";


export function guideStaticParams() {
  return GUIDE_SLUGS.map((slug) => ({ slug }));
}

export async function guideDetailMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const g = getGuide(locale, slug);
  if (!g) return {};
  return marketingMetadata({
    locale,
    title: `${g.title} | Zap Bridge`,
    description: g.description,
    path: guideDetailPath(g.slug),
    ogTitle: g.title,
  });
}

const publisher = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_URL,
  logo: absoluteUrl("/brand-mark.svg"),
};

function articleJsonLd(g: GuideArticle, locale: Locale): Record<string, unknown> {
  const url = absoluteUrl(localePath(locale, guideDetailPath(g.slug)));
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: g.title,
    description: g.description,
    inLanguage: htmlLang[locale],
    datePublished: g.datePublished,
    dateModified: g.dateModified ?? g.datePublished,
    author: publisher,
    publisher,
    mainEntityOfPage: url,
    image: absoluteUrl("/og"),
  };
}

function breadcrumbJsonLd(g: GuideArticle, locale: Locale): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: getDictionary(locale).guides.detail.breadcrumbRoot,
        item: absoluteUrl(localePath(locale, Routes.Guides)),
      },
      {
        "@type": "ListItem",
        position: 2,
        name: g.title,
        item: absoluteUrl(localePath(locale, guideDetailPath(g.slug))),
      },
    ],
  };
}

function faqJsonLd(items: { q: string; a: string }[]): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function GuideDetailView({ slug, locale }: { slug: string; locale: Locale }) {
  const g = getGuide(locale, slug);
  if (!g) notFound();

  const t = getDictionary(locale).guides.detail;
  const faqItems = guideFaqItems(g);
  const related = getGuides(locale)
    .filter((x) => x.slug !== g.slug)
    .slice(0, 2);

  // 文末两枚 CTA 的落点。ctaTarget 显式覆盖优先于 industry，二者互斥
  // （由 lib/seo/guides-industry.test.ts 守护），所以查表不会撞车。
  const CTA_OVERRIDES = {
    "anti-ban": { href: Routes.AntiBan, label: t.ctaAntiBan },
    whatsapp: { href: Routes.WhatsAppLanding, label: t.ctaWhatsApp },
  } as const;
  const mainCta = g.ctaTarget
    ? CTA_OVERRIDES[g.ctaTarget]
    : g.industry
      ? {
          href: templateIndustryPath(g.industry),
          label: t.ctaIndustryTemplates.replace("{industry}", industryLabel(g.industry, locale)),
        }
      : { href: Routes.Templates, label: t.ctaTemplates };

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <JsonLd data={articleJsonLd(g, locale)} />
      <JsonLd data={breadcrumbJsonLd(g, locale)} />
      {faqItems.length > 0 && <JsonLd data={faqJsonLd(faqItems)} />}
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <nav className={`text-xs text-muted-foreground ${fonts.mono}`}>
          <Link href={localePath(locale, Routes.Guides)} className="hover:text-aqua-700">
            {t.breadcrumbRoot}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{g.title}</span>
        </nav>

        <article className="mt-6">
          <h1 className={`text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
            {g.title}
          </h1>
          <p className={`mt-4 text-xs text-muted-foreground ${fonts.mono}`}>
            {t.updatedAt.replace("{date}", g.dateModified ?? g.datePublished)}
          </p>
          <div className="mt-8">
            <GuideArticleView article={g} locale={locale} />
          </div>
        </article>

        <section className="mt-16 rounded-2xl border border-border bg-aqua-50/50 p-8 text-center">
          <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>{t.ctaTitle}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{fillCounts(t.ctaDesc)}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {/* 主 CTA 落点：ctaTarget 显式覆盖优先，其次按所属行业指向该行业页，
                最后才回落通用模板库——读完行业文的人要找的是这个行业的模板，
                把他丢进全库总列表是白白折损一次转化。 */}
            <Link
              href={localePath(locale, mainCta.href)}
              className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              {mainCta.label}
            </Link>
            {/* 合规簇（ctaTarget: anti-ban）的次 CTA 换成自检器：读完「审核会盯什么」
                的人，下一步最自然的动作是「那我那张页现在什么样」，而不是注册开户。
                主 CTA 仍指向 anti-ban，变现路径不让位；自检报告页本身再引导注册，
                漏斗顺序比在这里直接要注册更顺。其余文章保持注册。 */}
            <Link
              href={localePath(locale, g.ctaTarget === "anti-ban" ? Routes.PageCheck : Routes.Register)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-aqua-300 hover:text-aqua-700"
            >
              {g.ctaTarget === "anti-ban" ? t.ctaPageCheck : t.ctaRegister}
            </Link>
          </div>
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
              {t.relatedHeading}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              {related.map((r) => (
                <Link
                  key={r.slug}
                  href={localePath(locale, guideDetailPath(r.slug))}
                  className="group rounded-2xl border border-border bg-white/60 p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
                >
                  <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-aqua-700">
                    {r.title}
                  </h3>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                    {r.description}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
}
