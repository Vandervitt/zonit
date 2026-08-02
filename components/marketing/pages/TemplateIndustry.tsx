import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { conversionLabel, archetypeLabel } from "@/landing-editor/samples/templateFilter";
import { Routes, templateDetailPath, templateIndustryPath, guideDetailPath } from "@/lib/constants";
import { getGuideForIndustry } from "@/app/guides/_content";
import { marketingMetadata } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildIndustrySeoContent,
  industryBreadcrumbJsonLd,
  industryCountLabel,
  industryItemListJsonLd,
  industryLabel,
} from "@/lib/seo/industry-content";
import {
  industryCategories,
  isIndexableIndustry,
  templatesInIndustry,
} from "@/lib/templates/industries";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { buildUnsplashImageSources } from "@/lib/images/unsplash";
import { templateFaqJsonLd } from "@/lib/seo/template-content";
import type { Locale } from "@/lib/i18n/config";

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

export function industryStaticParams() {
  return industryCategories().map((category) => ({ category }));
}

export async function templateIndustryMetadata(category: string, locale: Locale): Promise<Metadata> {
  const seo = buildIndustrySeoContent(category, locale);
  if (!seo) return {};
  const base = marketingMetadata({
    locale,
    title: seo.metaTitle,
    description: seo.metaDescription,
    path: templateIndustryPath(category),
  });
  // 只有一套模板的行业，其行业页与那唯一一张详情页内容高度重合——放出去等于
  // 自造重复页。页面照常可访问、可内链（权重仍能流向详情页），但不请求收录。
  if (isIndexableIndustry(category)) return base;
  return { ...base, robots: { index: false, follow: true } };
}

export async function TemplateIndustryView({
  category,
  locale,
}: {
  category: string;
  locale: Locale;
}) {
  const seo = buildIndustrySeoContent(category, locale);
  if (!seo) notFound();

  const dict = getDictionary(locale);
  const t = dict.templateIndustry.shared;
  const gallery = dict.templates.gallery;
  const items = templatesInIndustry(category);
  const others = industryCategories().filter((c) => c !== category);
  const faqJsonLd = templateFaqJsonLd(seo.faqs);
  const guide = getGuideForIndustry(locale, category);

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <JsonLd data={industryBreadcrumbJsonLd(category, locale)!} />
      <JsonLd data={industryItemListJsonLd(category, locale)!} />
      {/* 行业 FAQ 本身就是每行业独有的，恒满足门槛；护栏在此仅作兜底。 */}
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <nav className={`text-xs text-muted-foreground ${fonts.mono}`}>
          <Link href={localePath(locale, Routes.Templates)} className="hover:text-aqua-700">
            {t.breadcrumbRoot}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{industryLabel(category, locale)}</span>
        </nav>

        <header className="mt-6 max-w-3xl">
          <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
            {t.kicker}
          </span>
          <h1 className={`mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
            {seo.h1}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{seo.lead}</p>
          <p className={`mt-3 text-xs text-muted-foreground ${fonts.mono}`}>
            {industryCountLabel(seo.count, locale)}
          </p>
        </header>

        <section className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="max-w-2xl space-y-5 lg:col-span-2">
            {seo.intro.map((p) => (
              <p key={p.slice(0, 24)} className="text-base leading-relaxed text-foreground/80">
                {p}
              </p>
            ))}
          </div>
          <aside className="space-y-6">
            <div className="rounded-2xl border border-border bg-white/60 p-6">
              <h2 className={`text-base font-bold tracking-tight text-foreground ${fonts.display}`}>
                {t.whoForHeading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{seo.whoFor}</p>
            </div>
            <div className="rounded-2xl border border-border bg-white/60 p-6">
              <h2 className={`text-base font-bold tracking-tight text-foreground ${fonts.display}`}>
                {t.leadsHeading}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{seo.leadsArrive}</p>
            </div>
          </aside>
        </section>

        {seo.crossBorder && (
          <section className="mt-14 max-w-3xl rounded-2xl border border-aqua-100 bg-aqua-50/40 p-6">
            <h2 className={`text-base font-bold tracking-tight text-foreground ${fonts.display}`}>
              {t.crossBorderHeading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{seo.crossBorder}</p>
          </section>
        )}

        <section className="mt-16">
          <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
            {t.templatesHeading}
          </h2>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((tpl, index) => {
              const image = buildUnsplashImageSources(tpl.thumbnail);
              // 行业页首屏之下即是模板宫格，前三张按首屏处理（lg 下一行 3 列）。
              const isAboveFold = index < 3;
              return (
                <Link
                  key={tpl.id}
                  href={localePath(locale, templateDetailPath(tpl.id))}
                  className="group overflow-hidden rounded-2xl border border-border bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-aqua-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 外链缩略图与模板画廊同源，未纳入 next/image 域名白名单 */}
                    <img
                      src={image.src}
                      srcSet={image.srcSet}
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      alt={gallery.thumbnailAlt.replace("{name}", tpl.name)}
                      loading={isAboveFold ? "eager" : "lazy"}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{tpl.name}</h3>
                      <span className={`shrink-0 text-[11px] text-muted-foreground ${fonts.mono}`}>
                        {tpl.industry[locale]}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {tpl.tagline[locale]}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {tpl.tags.conversion.map((c) => (
                        <span key={c} className="rounded-full bg-aqua-50 px-2 py-0.5 text-[11px] text-aqua-700">
                          {gallery.captureTag.replace("{channel}", conversionLabel(locale, c))}
                        </span>
                      ))}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {archetypeLabel(locale, tpl.tags.archetype)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
          <p className="mt-8">
            <Link
              href={localePath(locale, Routes.Register)}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              {t.cta}
            </Link>
          </p>
        </section>

        {guide && (
          <section className="mt-16 max-w-3xl">
            <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
              {t.guideHeading}
            </h2>
            {/* 反向内链：行业页 ↔ 行业获客文互指，把「行业文 → 行业页 → 模板页」串成漏斗。 */}
            <Link
              href={localePath(locale, guideDetailPath(guide.slug))}
              className="group mt-5 block rounded-2xl border border-border bg-white/60 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
            >
              <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-aqua-700">
                {guide.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{guide.description}</p>
            </Link>
          </section>
        )}

        <section className="mt-16">
          <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
            {t.faqHeading}
          </h2>
          <dl className="mt-6 divide-y divide-border border-t border-border">
            {seo.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-sm font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section className="mt-16">
          <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
            {t.otherIndustriesHeading}
          </h2>
          <div className="mt-5 flex flex-wrap gap-2">
            {others.map((c) => (
              <Link
                key={c}
                href={localePath(locale, templateIndustryPath(c))}
                className="rounded-full border border-border px-3.5 py-1.5 text-sm text-muted-foreground transition-colors hover:border-aqua-300 hover:text-aqua-700"
              >
                {industryLabel(c, locale)}
              </Link>
            ))}
            <Link
              href={localePath(locale, Routes.Templates)}
              className="rounded-full bg-aqua-50 px-3.5 py-1.5 text-sm text-aqua-700 transition-colors hover:brightness-95"
            >
              {t.allTemplates}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
}
