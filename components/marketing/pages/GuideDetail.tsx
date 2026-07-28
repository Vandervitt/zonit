import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, guideDetailPath } from "@/lib/constants";
import { marketingMetadata, SITE_NAME, SITE_URL, absoluteUrl } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import { getGuides, getGuide, guideFaqItems, GUIDE_SLUGS } from "@/app/guides/_content";
import { GuideArticleView } from "@/app/guides/_components/GuideArticleView";
import type { GuideArticle } from "@/app/guides/_content/types";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { htmlLang, type Locale } from "@/lib/i18n/config";

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

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
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t.ctaDesc}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={localePath(locale, Routes.Templates)}
              className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              {t.ctaTemplates}
            </Link>
            <Link
              href={localePath(locale, Routes.Register)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-aqua-300 hover:text-aqua-700"
            >
              {t.ctaRegister}
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
