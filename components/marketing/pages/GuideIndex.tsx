import type { Metadata } from "next";
import Link from "next/link";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, guideDetailPath } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getGuides } from "@/app/guides/_content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

export function guideIndexMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).guides.meta;
  return marketingMetadata({
    locale,
    title: t.title,
    description: t.description,
    path: Routes.Guides,
    ogTitle: t.ogTitle,
  });
}

export function GuideIndexView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).guides.list;
  const items = getGuides(locale);

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <header className="max-w-2xl">
          <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>{t.kicker}</span>
          <h1 className={`mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
            {t.title}
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t.subtitle}</p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {items.map((g) => (
            <Link
              key={g.slug}
              href={localePath(locale, guideDetailPath(g.slug))}
              className="group flex flex-col rounded-2xl border border-border bg-white/60 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold leading-snug text-foreground group-hover:text-aqua-700">
                {g.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{g.description}</p>
              <span className={`mt-4 text-sm font-medium text-aqua-700 ${fonts.mono}`}>{t.readMore}</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
}
