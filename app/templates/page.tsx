import type { Metadata } from "next";
import Link from "next/link";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { TEMPLATES } from "@/landing-editor/samples/registry";
import { CATEGORY_LABELS, CONVERSION_LABELS } from "@/landing-editor/samples/templateFilter";
import { Routes, templateDetailPath } from "@/lib/constants";

export const metadata: Metadata = {
  title: "30+ 海外获客落地页模板库 — 按行业挑选，直接开始 | Zap Bridge",
  description:
    "覆盖美妆、服饰、3C、家居、保健、母婴等行业的海外获客落地页模板：WhatsApp / 表单留资范式、投放级结构、合规页脚开箱即用。挑一套喜欢的，几分钟改成你自己的页面。",
  openGraph: {
    type: "website",
    title: "30+ 海外获客落地页模板库 | Zap Bridge",
    description:
      "按行业挑一套投放级获客落地页模板，改内容、绑域名、发布上线——不用从空白页开始。",
  },
};

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

/** 按注册表出现顺序稳定分组（行业 → 模板列表）。 */
function groupByCategory() {
  const groups: { category: string; label: string; items: typeof TEMPLATES }[] = [];
  for (const t of TEMPLATES) {
    const category = t.tags.category;
    let g = groups.find((x) => x.category === category);
    if (!g) {
      g = { category, label: CATEGORY_LABELS[category] ?? category, items: [] };
      groups.push(g);
    }
    g.items.push(t);
  }
  return groups;
}

export default function TemplatesGalleryPage() {
  const groups = groupByCategory();
  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <header className="mx-auto max-w-2xl text-center">
          <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>Templates</span>
          <h1 className={`mt-3 text-4xl font-bold tracking-tight text-foreground ${fonts.display}`}>
            海外获客落地页模板库
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            {TEMPLATES.length} 套投放级留资模板，覆盖 {groups.length} 个行业。全部为咨询与留资范式
            （WhatsApp / 表单 / 电话），自带合规页脚——挑一套，改内容，发布到你自己的域名。
          </p>
          <p className="mt-6">
            <Link
              href={Routes.Register}
              className="inline-flex items-center rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              免费开始 · 注册即赠 Pro 7 天
            </Link>
          </p>
        </header>

        {groups.map((g) => (
          <section key={g.category} className="mt-16">
            <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>{g.label}</h2>
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {g.items.map((t) => (
                <Link
                  key={t.id}
                  href={templateDetailPath(t.id)}
                  className="group overflow-hidden rounded-2xl border border-border bg-white/70 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
                >
                  <div className="aspect-[16/10] overflow-hidden bg-aqua-50">
                    {/* eslint-disable-next-line @next/next/no-img-element -- 外链缩略图与模板选择器同源，未纳入 next/image 域名白名单 */}
                    <img
                      src={t.thumbnail}
                      alt={`${t.name} 模板预览图`}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="font-semibold text-foreground">{t.name}</h3>
                      <span className={`shrink-0 text-[11px] text-muted-foreground ${fonts.mono}`}>{t.industry}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{t.tagline}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {t.tags.conversion.map((c) => (
                        <span key={c} className="rounded-full bg-aqua-50 px-2 py-0.5 text-[11px] text-aqua-700">
                          {CONVERSION_LABELS[c] ?? c}留资
                        </span>
                      ))}
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600">{t.tags.archetype}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </main>
      <SiteFooter fonts={fonts} />
    </div>
  );
}
