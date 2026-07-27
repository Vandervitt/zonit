import type { Metadata } from "next";
import Link from "next/link";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, guideDetailPath } from "@/lib/constants";
import { marketingMetadata } from "@/lib/seo/site";
import { GUIDES } from "./_content";

export const metadata: Metadata = marketingMetadata({
  // 尚未国际化：显式声明中文，保持现有 canonical 与描述不变（见 PR 2/3/4）
  locale: "zh",
  title: "海外获客落地页指南 — 投放、合规与转化归因实操 | Zap Bridge",
  description:
    "面向出海广告主的获客落地页实操指南：广告落地页防拒审、WhatsApp 获客页搭建、转化归因(像素/UTM/CAPI)等，帮你把广告费花在能转化、能归因的页面上。",
  path: Routes.Guides,
  ogTitle: "海外获客落地页指南 | Zap Bridge",
});

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

export default function GuidesPage() {
  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} />
      <main className="mx-auto max-w-5xl px-6 pb-24 pt-32">
        <header className="max-w-2xl">
          <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>指南</span>
          <h1 className={`mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
            海外获客落地页指南
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            面向出海广告主的实操指南：投放合规、页面搭建、转化归因——把广告费花在能转化、能归因的页面上。
          </p>
        </header>

        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {GUIDES.map((g) => (
            <Link
              key={g.slug}
              href={guideDetailPath(g.slug)}
              className="group flex flex-col rounded-2xl border border-border bg-white/60 p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-aqua-300 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold leading-snug text-foreground group-hover:text-aqua-700">
                {g.title}
              </h2>
              <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">{g.description}</p>
              <span className={`mt-4 text-sm font-medium text-aqua-700 ${fonts.mono}`}>阅读全文 →</span>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter fonts={fonts} />
    </div>
  );
}
