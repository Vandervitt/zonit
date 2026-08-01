import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";
import { conversionLabel, archetypeLabel } from "@/landing-editor/samples/templateFilter";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { IDENTITY_VARIANT } from "@/landing-renderer/variant";
import { Routes, templateDetailPath } from "@/lib/constants";
import type { LandingPageDraft } from "@/types/schema.draft";
import { marketingMetadata } from "@/lib/seo/site";
import { JsonLd } from "@/components/seo/JsonLd";
import {
  buildTemplateSeoContent,
  conversionText,
  templateBreadcrumbJsonLd,
  templateFaqJsonLd,
} from "@/lib/seo/template-content";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { buildUnsplashImageSources } from "@/lib/images/unsplash";
import type { Locale } from "@/lib/i18n/config";

/**
 * 画廊展示预处理：样稿的 CTA 链接刻意留白（选用后由用户填写），preview 渲染会对
 * 空链接标注「链接未填 · 线上不显示」的编辑器提示——对公开访客是噪音。
 * 这里仅为展示把空链接指向页内锚点，不改模板本体。
 */
function toDisplayDraft(draft: LandingPageDraft): LandingPageDraft {
  const d = structuredClone(draft);
  // 模板详情页是公开展示样稿，联系方式已被 blankTemplateContacts 清空——
  // 补一个占位号码，让按钮照常渲染出来（观众看的是版式，不会真去点）。
  // 号码用 E.164 占位段，点了也拨不通，不会误导成真实商家号码。
  for (const channel of ["whatsapp", "phone", "telegram"] as const) {
    if (!d.contact[channel]) d.contact[channel] = "+10000000000";
  }
  if (!d.contact.email) d.contact.email = "preview@example.com";
  return d;
}

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

export function templateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }));
}

export async function templateDetailMetadata(slug: string, locale: Locale): Promise<Metadata> {
  const t = TEMPLATES.find((x) => x.id === slug);
  if (!t) return {};
  const d = getDictionary(locale).templateContent.detailMeta;
  const title = d.title
    .replace("{name}", t.name)
    .replace("{industry}", t.industry[locale]);
  const description = d.description
    .replace("{tagline}", t.tagline[locale])
    .replace("{conversion}", conversionText(t, locale));
  return marketingMetadata({
    locale,
    title,
    description,
    path: templateDetailPath(t.id),
    ogImage: t.thumbnail,
  });
}

export async function TemplateDetailView({ slug, locale }: { slug: string; locale: Locale }) {
  const t = TEMPLATES.find((x) => x.id === slug);
  if (!t) notFound();

  const dict = getDictionary(locale).templates;
  const draft = toDisplayDraft(await loadTemplateDraft(t.id));
  const related = TEMPLATES.filter((x) => x.tags.category === t.tags.category && x.id !== t.id).slice(0, 3);
  const startHref = `${Routes.LandingPages}?template=${t.id}`;
  const seo = buildTemplateSeoContent(t, draft, locale);

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <JsonLd data={templateBreadcrumbJsonLd(t, locale)} />
      <JsonLd data={templateFaqJsonLd(seo.faqs)} />
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <nav className={`text-xs text-muted-foreground ${fonts.mono}`}>
          <Link href={localePath(locale, Routes.Templates)} className="hover:text-aqua-700">
            {dict.detail.breadcrumbRoot}
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{t.name}</span>
        </nav>

        <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className={`text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
              {t.name}
              <span className="ml-3 align-middle text-sm font-normal text-muted-foreground">
                {t.industry[locale]}
              </span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t.tagline[locale]}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.tags.conversion.map((c) => (
                <span key={c} className="rounded-full bg-aqua-50 px-2.5 py-1 text-xs text-aqua-700">
                  {dict.gallery.captureTag.replace("{channel}", conversionLabel(locale, c))}
                </span>
              ))}
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">
                {archetypeLabel(locale, t.tags.archetype)}
              </span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={startHref}
              className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              {dict.detail.useTemplate}
            </Link>
            <Link
              href={localePath(locale, Routes.Templates)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-aqua-300 hover:text-aqua-700"
            >
              {dict.detail.otherTemplates}
            </Link>
          </div>
        </header>

        <section className="mt-8 max-w-3xl">
          <p className="text-base leading-relaxed text-foreground/80">{seo.intro}</p>
        </section>

        <p className={`mt-10 text-xs text-muted-foreground ${fonts.mono}`}>{dict.detail.detailIntroNote}</p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border shadow-sm">
          <LandingPage page={draft} pageId={`template-${t.id}`} variant={IDENTITY_VARIANT} preview />
        </div>

        <section className="mt-16 grid grid-cols-1 gap-12 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
              {dict.detail.includedHeading2}
            </h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {seo.included.map((label) => (
                <span key={label} className="rounded-full bg-aqua-50 px-3 py-1 text-sm text-aqua-700">
                  {label}
                </span>
              ))}
            </div>

            <h2 className={`mt-10 text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
              {dict.detail.howToHeading2}
            </h2>
            <ol className="mt-4 space-y-4">
              {seo.howToUse.map((s, i) => (
                <li key={s.step} className="flex gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-aqua-600 to-tech text-sm font-semibold text-white">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{s.step}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{s.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <aside className="rounded-2xl border border-border bg-white/60 p-6">
            <h2 className={`text-base font-bold tracking-tight text-foreground ${fonts.display}`}>
              {dict.detail.whoForHeading}
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{seo.whoFor}</p>
          </aside>
        </section>

        <section className="mt-16">
          <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
            {dict.detail.faqHeading}
          </h2>
          <dl className="mt-6 divide-y divide-border border-t border-border">
            {seo.faqs.map((f) => (
              <div key={f.q} className="py-5">
                <dt className="text-sm font-semibold text-foreground">{f.q}</dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.a}</dd>
              </div>
            ))}
          </dl>
        </section>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
              {dict.detail.relatedHeading}
            </h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map((r) => {
                const image = buildUnsplashImageSources(r.thumbnail);
                return (
                  <Link
                    key={r.id}
                    href={localePath(locale, templateDetailPath(r.id))}
                    className="group overflow-hidden rounded-2xl border border-border bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
                  >
                    <div className="aspect-[16/10] overflow-hidden bg-aqua-50">
                      {/* eslint-disable-next-line @next/next/no-img-element -- 外链缩略图与模板选择器同源，未纳入 next/image 域名白名单 */}
                      <img
                        src={image.src}
                        srcSet={image.srcSet}
                        sizes="(max-width: 640px) 100vw, 33vw"
                        alt={dict.gallery.thumbnailAlt.replace("{name}", r.name)}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-foreground">{r.name}</h3>
                      <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                        {r.tagline[locale]}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
}
