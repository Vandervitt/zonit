import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fonts } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, guideDetailPath } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { getReportForView, recordReportView } from "@/lib/tools/store";
import { currentVisitor } from "@/lib/tools/visitor";
import { pageCheckWithUrl } from "@/lib/tools/rerun-link";
import { auth } from "@/auth";
import { PageCheckVerify } from "./PageCheckVerify";
import type { Locale } from "@/lib/i18n/config";
import type { FindingLevel } from "@/lib/tools/report";


/**
 * 报告页一律 noindex。
 * 报告内容是**他人页面**的检查结果，大量此类页进索引既无价值也可能引起纠纷；
 * 且链接本就设计成「持有即可见」，不该被搜索引擎顺手公开（设计文档决议 2）。
 */
export async function pageCheckReportMetadata(id: string, locale: Locale): Promise<Metadata> {
  const envelope = await getReportForView(id);
  const t = getDictionary(locale).tools.report;
  // 过期报告仍然给出被检查站点的 host：标题是收件人回头看时的第一个锚点。
  const inputUrl =
    envelope?.state === "live" ? envelope.report.inputUrl : envelope?.inputUrl ?? "";
  return {
    title: t.metaTitle.replace("{host}", inputUrl ? safeHost(inputUrl) : ""),
    robots: { index: false, follow: false },
  };
}

/**
 * 过期报告页。
 *
 * 这一页存在的唯一理由：外发出去的报告链接，收件人可能几周后才想起来点开。
 * 那一刻给他 404 是最糟的结果——他还记得这封信，我们却拿不出任何东西。
 * 所以过期不展示旧结论（会误导），但保留「当初查的是哪个页面」并直接给出重查入口。
 */
async function ExpiredReport({
  envelope,
  locale,
}: {
  envelope: { inputUrl: string; createdAt: string };
  locale: Locale;
}) {
  const t = getDictionary(locale).tools.report.expired;
  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-3xl px-6 pb-24 pt-32">
        <span className={`text-xs uppercase tracking-[0.22em] text-slate-500 ${fonts.mono}`}>
          {t.kicker}
        </span>
        <h1 className={`mt-3 text-3xl font-bold tracking-tight text-foreground ${fonts.display}`}>
          {t.title}
        </h1>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.body}</p>

        <dl className={`mt-6 space-y-1 text-xs text-muted-foreground ${fonts.mono}`}>
          <div>
            <dt className="inline">{t.checkedUrl}: </dt>
            <dd className="inline break-all text-foreground">{envelope.inputUrl}</dd>
          </div>
          <div>{t.ranOn.replace("{date}", envelope.createdAt.slice(0, 10))}</div>
        </dl>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href={localePath(locale, pageCheckWithUrl(envelope.inputUrl))}
            className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-5 py-2.5 text-sm font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
          >
            {t.rerun}
          </Link>
          <Link
            href={localePath(locale, Routes.PageCheck)}
            className="rounded-xl border border-border px-5 py-2.5 text-sm text-muted-foreground transition-colors hover:border-aqua-300 hover:text-aqua-700"
          >
            {t.rerunOther}
          </Link>
        </div>
      </main>
      <SiteFooter fonts={fonts} locale={locale} />
    </div>
  );
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
  const envelope = await getReportForView(id);
  if (!envelope) notFound();

  // 过期访问同样记录——对方在链接过期后还回头来看，本身就是更强的信号。
  // recordReportView 永不抛错，页面渲染不会因为记录失败而挂掉。
  await recordReportView(id, await currentVisitor());

  if (envelope.state === "expired") {
    return <ExpiredReport envelope={envelope} locale={locale} />;
  }
  const report = envelope.report;

  const session = await auth();
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

        {/* 实测入口：已实测的报告不再展示（结论已经在上面了）。 */}
        {!report.browserVerified && (
          <PageCheckVerify
            reportId={report.id}
            signedIn={Boolean(session?.user?.id)}
            copy={t.verify}
            locale={locale}
          />
        )}

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
