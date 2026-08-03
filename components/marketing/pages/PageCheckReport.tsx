import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fontBody, fontHead, fontMono } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, guideDetailPath } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { getReport } from "@/lib/tools/store";
import type { Locale } from "@/lib/i18n/config";
import type { FindingLevel } from "@/lib/tools/report";

const fonts = { display: fontHead.className, body: fontBody.className, mono: fontMono.className };

/**
 * 报告页一律 noindex。
 * 报告内容是**他人页面**的检查结果，大量此类页进索引既无价值也可能引起纠纷；
 * 且链接本就设计成「持有即可见」，不该被搜索引擎顺手公开（设计文档决议 2）。
 */
export async function pageCheckReportMetadata(id: string, locale: Locale): Promise<Metadata> {
  const report = await getReport(id);
  const t = getDictionary(locale).tools.report;
  const host = report ? safeHost(report.inputUrl) : "";
  return {
    title: t.metaTitle.replace("{host}", host),
    robots: { index: false, follow: false },
  };
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

/** 把 {key} 占位符替换为 finding 携带的事实数据。 */
function fill(text: string, data?: Record<string, string | number>): string {
  if (!data) return text;
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in data ? String(data[k]) : m));
}

const LEVEL_STYLE: Record<FindingLevel, string> = {
  attention: "border-amber-200 bg-amber-50/60",
  unknown: "border-slate-200 bg-slate-50/60",
  info: "border-border bg-white/60",
};

const LEVEL_BADGE: Record<FindingLevel, string> = {
  attention: "bg-amber-100 text-amber-800",
  unknown: "bg-slate-200 text-slate-700",
  info: "bg-aqua-50 text-aqua-700",
};

export async function PageCheckReportView({ id, locale }: { id: string; locale: Locale }) {
  const report = await getReport(id);
  if (!report) notFound();

  const dict = getDictionary(locale);
  const t = dict.tools.report;
  const copy = dict.tools.findings as Record<
    string,
    { title: string; why: string; guide?: string }
  >;
  const failCopy = dict.tools.fetchFailed as Record<string, string>;

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
          {t.kicker}
        </span>
        <h1 className={`mt-3 text-3xl font-bold tracking-tight text-foreground ${fonts.display}`}>
          {t.title}
        </h1>

        <dl className={`mt-5 space-y-1 text-xs text-muted-foreground ${fonts.mono}`}>
          <div>
            <dt className="inline">{t.checkedUrl}: </dt>
            <dd className="inline break-all text-foreground">{report.inputUrl}</dd>
          </div>
          {report.finalUrl && report.finalUrl !== report.inputUrl && (
            <div>
              <dt className="inline">{t.redirectedTo}: </dt>
              <dd className="inline break-all text-foreground">{report.finalUrl}</dd>
            </div>
          )}
          <div>{t.createdAt.replace("{date}", report.createdAt.slice(0, 10))}</div>
        </dl>

        {/* 报告页最重要的一段：不把「我们不下结论」说清楚，整份报告会被读成评分。 */}
        <p className="mt-6 rounded-2xl border border-border bg-white/60 p-5 text-sm leading-relaxed text-muted-foreground">
          {t.disclaimer}
        </p>

        <section className="mt-8 space-y-3">
          {report.findings.length === 0 && (
            <p className="text-sm text-muted-foreground">{t.empty}</p>
          )}
          {report.findings.map((f, i) => {
            const c = copy[f.id];
            if (!c) return null; // 字典覆盖由 copy-coverage.test.ts 守护，此处仅兜底
            const level = f.level as FindingLevel;
            const detail =
              f.id === "fetch_failed" && typeof f.data?.reason === "string"
                ? failCopy[f.data.reason]
                : null;
            return (
              <article
                key={`${f.id}-${i}`}
                className={`rounded-2xl border p-5 ${LEVEL_STYLE[level]}`}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${LEVEL_BADGE[level]}`}
                  >
                    {t.levels[level]}
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">
                    {fill(c.title, f.data)}
                  </h2>
                </div>
                {detail && (
                  <p className="mt-2 text-sm leading-relaxed text-foreground/80">{detail}</p>
                )}
                {c.why && (
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{c.why}</p>
                )}
                {c.guide && (
                  <Link
                    href={localePath(locale, guideDetailPath(c.guide))}
                    className="mt-3 inline-block text-xs font-medium text-aqua-700 hover:underline"
                  >
                    {t.readMore} →
                  </Link>
                )}
              </article>
            );
          })}
        </section>

        {/* 明示可分享性：链接本就设计成「持有即可见」，不能让用户以为它是私密的。 */}
        <p className="mt-8 text-xs leading-relaxed text-muted-foreground">{t.shareNotice}</p>

        <p className="mt-6">
          <Link
            href={localePath(locale, Routes.PageCheck)}
            className="text-sm font-medium text-aqua-700 hover:underline"
          >
            {t.rerun} →
          </Link>
        </p>

        <section className="mt-16 rounded-2xl border border-border bg-aqua-50/50 p-8 text-center">
          <h2 className={`text-xl font-bold tracking-tight text-foreground ${fonts.display}`}>
            {t.ctaTitle}
          </h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
            {t.ctaBody}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href={localePath(locale, Routes.Templates)}
              className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
            >
              {t.ctaTemplates}
            </Link>
            <Link
              href={localePath(locale, Routes.AntiBan)}
              className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-aqua-300 hover:text-aqua-700"
            >
              {t.ctaAntiBan}
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
}
