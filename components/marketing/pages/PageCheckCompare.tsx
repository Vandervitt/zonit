import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { fonts } from "@/lib/fonts";
import { SiteNav, SiteFooter } from "@/components/marketing/chrome";
import { Routes, pageCheckReportPath } from "@/lib/constants";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { getBatchReports } from "@/lib/tools/store";
import { buildCompareTable, DIMENSIONS, type Dimension } from "@/lib/tools/compare";
import type { Locale } from "@/lib/i18n/config";
import type { FindingLevel } from "@/lib/tools/report";

/**
 * 与单页报告同样一律 noindex：内容是**他人页面**的检查结果，
 * 且链接本就设计成「持有即可见」（设计文档决议 2）。
 */
export async function pageCheckCompareMetadata(id: string, locale: Locale): Promise<Metadata> {
  const reports = await getBatchReports(id);
  const t = getDictionary(locale).tools.compare;
  return {
    title: t.metaTitle.replace("{count}", String(reports.length)),
    robots: { index: false, follow: false },
  };
}

function fill(text: string, data: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in data ? String(data[k]) : m));
}

/** 单元格底色。与单页报告同一套语义，但更淡——一屏几十格，重色会糊成一片。 */
const CELL_STYLE: Record<FindingLevel, string> = {
  attention: "bg-amber-50 text-amber-900",
  unknown: "bg-slate-50 text-slate-600",
  info: "bg-white text-muted-foreground",
};

export async function PageCheckCompareView({ id, locale }: { id: string; locale: Locale }) {
  const reports = await getBatchReports(id);
  if (reports.length === 0) notFound();

  const dict = getDictionary(locale);
  const t = dict.tools.compare;
  const copy = dict.tools.findings as Record<string, { title: string; why: string }>;
  const table = buildCompareTable(reports);
  const total = table.rows.length;

  return (
    <div className={`min-h-screen bg-background ${fonts.body}`}>
      <SiteNav fonts={fonts} locale={locale} />
      <main className="mx-auto max-w-6xl px-6 pb-24 pt-32">
        <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
          {t.kicker}
        </span>
        <h1 className={`mt-3 text-3xl font-bold tracking-tight text-foreground ${fonts.display}`}>
          {fill(t.title, { count: total })}
        </h1>
        <p className={`mt-4 text-xs text-muted-foreground ${fonts.mono}`}>
          {fill(t.createdAt, { date: reports[0].createdAt.slice(0, 10) })}
        </p>

        {/* 多页比单页更容易被读成排名，这段必须在表格之前。 */}
        <p className="mt-6 rounded-2xl border border-border bg-white/60 p-5 text-sm leading-relaxed text-muted-foreground">
          {t.disclaimer}
        </p>

        {/* 宽表在窄屏必须自己横向滚动，页面 body 不能横向滚动。 */}
        <div className="mt-8 overflow-x-auto rounded-2xl border border-border">
          <table className="w-full min-w-[64rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-white/70">
                <th className="sticky left-0 z-10 bg-white/95 px-4 py-3 text-xs font-semibold text-foreground">
                  &nbsp;
                </th>
                {DIMENSIONS.map((dim) => (
                  <th key={dim} className="px-3 py-3 align-bottom">
                    <span className="block text-xs font-semibold text-foreground">
                      {t.dimensions[dim]}
                    </span>
                    {/*
                      计数不是评分：只回答「这批里有几张页在这项上要看看」。
                      ⚠️ 没有 attention 但有 unknown 时**不能显示「无」**——那会
                      被读成「这项没问题」，而真相是静态检查看不出来。
                    */}
                    <span
                      className={`mt-1 block text-[11px] ${
                        table.attentionCount[dim] > 0
                          ? "text-amber-700"
                          : "text-muted-foreground"
                      } ${fonts.mono}`}
                    >
                      {table.attentionCount[dim] > 0
                        ? fill(t.attentionCount, { n: table.attentionCount[dim], total })
                        : table.unknownCount[dim] > 0
                          ? fill(t.unknownCount, { n: table.unknownCount[dim], total })
                          : t.noAttention}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table.rows.map((row) => (
                <tr key={row.reportId} className="border-b border-border last:border-0">
                  <th
                    scope="row"
                    className="sticky left-0 z-10 max-w-[14rem] bg-white/95 px-4 py-3 align-top"
                  >
                    <span className="block truncate text-xs font-semibold text-foreground">
                      {row.host}
                    </span>
                    <Link
                      href={localePath(locale, pageCheckReportPath(row.reportId))}
                      className="mt-1 inline-block text-[11px] font-medium text-aqua-700 hover:underline"
                    >
                      {t.openReport} →
                    </Link>
                  </th>
                  {row.blocked ? (
                    // 整页没检查成时不铺各维度格子：空白会被读成「这些都没问题」。
                    <td
                      colSpan={DIMENSIONS.length}
                      className="bg-slate-50 px-3 py-3 text-xs text-slate-600"
                    >
                      {t.blockedRow}
                    </td>
                  ) : (
                    DIMENSIONS.map((dim: Dimension) => {
                      const finding = row.cells[dim].finding;
                      if (!finding) {
                        return <td key={dim} className="px-3 py-3 text-xs text-muted-foreground/50">—</td>;
                      }
                      const c = copy[finding.id];
                      return (
                        <td
                          key={dim}
                          className={`px-3 py-3 text-xs leading-snug ${CELL_STYLE[finding.level]}`}
                        >
                          {c ? c.title.replace(/\{(\w+)\}/g, (m, k) =>
                            finding.data && k in finding.data ? String(finding.data[k]) : m,
                          ) : finding.id}
                        </td>
                      );
                    })
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
