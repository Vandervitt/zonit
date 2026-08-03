import type { Metadata } from "next";
import Link from "next/link";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, guideDetailPath } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { PageCheckForm } from "./PageCheckForm";
import { getGuide } from "@/app/guides/_content";
import type { Locale } from "@/lib/i18n/config";

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

/** 工具页本身要可索引（它是获客入口）；报告页则 noindex，见 PageCheckReport。 */
export function pageCheckMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).tools.check.meta;
  return marketingMetadata({
    locale,
    title: t.title,
    description: t.description,
    path: Routes.PageCheck,
  });
}

/** 工具页会引用到的合规文章——读者按图索骥的入口。 */
const RELATED_GUIDES = [
  "ad-account-ban-landing-page-audit",
  "landing-page-duplicate-detection",
  "landing-page-privacy-policy-footer",
] as const;

export function PageCheckView({ locale }: { locale: Locale }) {
  const dict = getDictionary(locale);
  const t = dict.tools.check;
  const guides = dict.guides;

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
          {t.kicker}
        </span>
        <h1
          className={`mt-3 text-3xl font-bold leading-tight tracking-tight text-foreground sm:text-4xl ${fonts.display}`}
        >
          {t.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.subtitle}</p>

        <PageCheckForm copy={t} locale={locale} />

        <section className="mt-16">
          <h2 className={`text-lg font-bold tracking-tight text-foreground ${fonts.display}`}>
            {guides.detail.relatedHeading}
          </h2>
          <div className="mt-5 grid grid-cols-1 gap-3">
            {RELATED_GUIDES.map((slug) => {
              const g = getGuide(locale, slug);
              if (!g) return null;
              return (
                <Link
                  key={slug}
                  href={localePath(locale, guideDetailPath(slug))}
                  className="group rounded-xl border border-border bg-white/60 px-5 py-4 transition-colors hover:border-aqua-300"
                >
                  <span className="text-sm font-semibold text-foreground group-hover:text-aqua-700">
                    {g.title}
                  </span>
                  <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                    {g.description}
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
}
