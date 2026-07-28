import type { Metadata } from "next";
import Link from "next/link";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { categoryLabel, conversionLabel, archetypeLabel } from "@/landing-editor/samples/templateFilter";
import { Routes, templateDetailPath } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

export function templateGalleryMetadata(locale: Locale): Metadata {
  const t = getDictionary(locale).templates.meta;
  return marketingMetadata({
    locale,
    title: t.title,
    description: t.description,
    path: Routes.Templates,
    ogTitle: t.ogTitle,
    ogDescription: t.ogDescription,
  });
}

/** 按注册表出现顺序稳定分组（行业 → 模板列表）。 */
function groupByCategory(locale: Locale) {
  const groups: { category: string; label: string; items: typeof TEMPLATES }[] = [];
  for (const t of TEMPLATES) {
    const category = t.tags.category;
    let g = groups.find((x) => x.category === category);
    if (!g) {
      g = { category, label: categoryLabel(locale, category), items: [] };
      groups.push(g);
    }
    g.items.push(t);
  }
  return groups;
}

export function TemplateGalleryView({ locale }: { locale: Locale }) {
  const t = getDictionary(locale).templates;
  const groups = groupByCategory(locale);
  const subtitle = t.gallery.subtitle
    .replace("{templates}", String(TEMPLATES.length))
    .replace("{industries}", String(groups.length));

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <header className="mx-auto max-w-2xl text-center">
          <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
            {t.gallery.kicker}
          </span>
          <h1 className={`mt-3 text-4xl font-bold tracking-tight text-foreground ${fonts.display}`}>
            {t.gallery.title}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">{subtitle}</p>
          <p className="mt-6">
            <Link
              href={localePath(locale, Routes.Register)}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              {t.gallery.cta}
            </Link>
          </p>
        </header>

        {groups.map((g) => (
          <section key={g.category} className="mt-16">
            <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>{g.label}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((tpl) => (
                <Link
                  key={tpl.id}
                  href={localePath(locale, templateDetailPath(tpl.id))}
                  className="group overflow-hidden rounded-2xl border border-border bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-aqua-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 外链缩略图与模板选择器同源，未纳入 next/image 域名白名单 */}
                    <img
                      src={tpl.thumbnail}
                      alt={t.gallery.thumbnailAlt.replace("{name}", tpl.name)}
                      loading="lazy"
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
                          {t.gallery.captureTag.replace("{channel}", conversionLabel(locale, c))}
                        </span>
                      ))}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">
                        {archetypeLabel(locale, tpl.tags.archetype)}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
}
