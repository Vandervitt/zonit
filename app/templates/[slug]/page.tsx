import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";
import { CONVERSION_LABELS } from "@/landing-editor/samples/templateFilter";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { IDENTITY_VARIANT } from "@/landing-renderer/variant";
import { Routes, templateDetailPath } from "@/lib/constants";
import type { LandingPageDraft } from "@/types/schema.draft";

/**
 * 画廊展示预处理：样稿的 CTA 链接刻意留白（选用后由用户填写），preview 渲染会对
 * 空链接标注「链接未填 · 线上不显示」的编辑器提示——对公开访客是噪音。
 * 这里仅为展示把空链接指向页内锚点，不改模板本体。
 */
function toDisplayDraft(draft: LandingPageDraft): LandingPageDraft {
  const d = structuredClone(draft);
  if (d.hero.cta && !d.hero.cta.link) d.hero.cta.link = "#";
  if (d.hero.secondaryCta && !d.hero.secondaryCta.link) d.hero.secondaryCta.link = "#";
  if (d.floatingButton && !d.floatingButton.link) d.floatingButton.link = "#";
  return d;
}

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

// 模板集为静态注册表：全量 SSG，未知 slug 一律 404。
export const dynamicParams = false;
export function generateStaticParams() {
  return TEMPLATES.map((t) => ({ slug: t.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const t = TEMPLATES.find((x) => x.id === slug);
  if (!t) return {};
  const title = `${t.name} — ${t.industry} 获客落地页模板 | Zap Bridge`;
  const description = `${t.tagline}投放级留资结构、合规页脚开箱即用；选用后改内容、绑域名，几分钟发布到你自己的品牌域名。`;
  return {
    title,
    description,
    openGraph: { type: "website", title, description, images: [{ url: t.thumbnail }] },
  };
}

export default async function TemplateDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const t = TEMPLATES.find((x) => x.id === slug);
  if (!t) notFound();

  const draft = toDisplayDraft(await loadTemplateDraft(t.id));
  const related = TEMPLATES.filter((x) => x.tags.category === t.tags.category && x.id !== t.id).slice(0, 3);
  const startHref = `${Routes.LandingPages}?template=${t.id}`;

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <nav className={`text-xs text-muted-foreground ${fonts.mono}`}>
          <Link href={Routes.Templates} className="hover:text-aqua-700">模板库</Link>
          <span className="mx-2">/</span>
          <span>{t.industry}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{t.name}</span>
        </nav>

        <header className="mt-6 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className={`text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
              {t.name}
              <span className="ml-3 align-middle text-sm font-normal text-muted-foreground">{t.industry}</span>
            </h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{t.tagline}</p>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {t.tags.conversion.map((c) => (
                <span key={c} className="rounded-full bg-aqua-50 px-2.5 py-1 text-xs text-aqua-700">
                  {CONVERSION_LABELS[c] ?? c}留资
                </span>
              ))}
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600">{t.tags.archetype}</span>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <Link
              href={startHref}
              className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              用这个模板开始
            </Link>
            <Link
              href={Routes.Templates}
              className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-aqua-300 hover:text-aqua-700"
            >
              看其他模板
            </Link>
          </div>
        </header>

        <p className={`mt-10 text-xs text-muted-foreground ${fonts.mono}`}>
          ↓ 以下为模板样稿实时渲染（文案与图片均可在编辑器中替换；预览中留资入口不产生真实提交）
        </p>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border shadow-sm">
          <LandingPage page={draft} pageId={`template-${t.id}`} variant={IDENTITY_VARIANT} preview />
        </div>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>同行业模板</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-3">
              {related.map((r) => (
                <Link
                  key={r.id}
                  href={templateDetailPath(r.id)}
                  className="group overflow-hidden rounded-2xl border border-border bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-aqua-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 外链缩略图与模板选择器同源，未纳入 next/image 域名白名单 */}
                    <img src={r.thumbnail} alt={`${r.name} 模板预览图`} loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-foreground">{r.name}</h3>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{r.tagline}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>
      <SiteFooter fonts={fonts} />
    </div>
  );
}
