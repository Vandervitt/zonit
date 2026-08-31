// lib/tools/compare.ts
//
// 多页横向对比：把 N 份单页报告折成一张「页 × 维度」的表。
//
// 沿用单页报告的两条红线（见 report.ts 顶部）：
//   ① **不给评分、不给排名**。不算「谁最差」，不给每页一个总分——一旦有分数，
//      读者就只看分数，而这份表的价值恰恰在于每一格背后那条可核实的事实。
//   ② 只产出 id 与结构化事实，文案在字典里按 id 取。
//
// 唯一的聚合是「这一列有几页需要注意」，那是**计数不是评判**：它回答
// 「我这批客户里有几个缺隐私政策」，这正是代运营方一眼要看的东西。

import { FINDING_DIMENSION, UNCOMPARABLE_FINDINGS, type Finding, type FindingLevel } from "./report";
import type { StoredReport } from "./store";

/** 对比表的列顺序。合规相关在前——那是账户风险，比页面重不重要紧得多。 */
export const DIMENSIONS = [
  "privacy",
  "terms",
  "consent",
  "contact",
  "form_fields",
  "conversion_position",
  "trust",
  "viewport",
  "hops",
  "weight",
  "scripts",
  "copyright",
] as const;

export type Dimension = (typeof DIMENSIONS)[number];

/** 一格：命中的 finding（没有则为 null，表示这一维度这页没有可报的观察）。 */
export interface CompareCell {
  finding: Finding | null;
}

export interface CompareRow {
  reportId: string;
  inputUrl: string;
  host: string;
  /**
   * 表格行标识。**必须能把这一批里的每一行区分开**——这是整张表可用性的前提：
   * 报告说「有一张页缺隐私政策」时，读者要能看出是哪一张。
   *
   * ⚠️ 曾经只放 host，于是 `go.x.com/in-house` 与 `go.x.com/playbook` 两行同名，
   * 而「同域多路径」恰恰是代运营方最常见的形态。见 compare.test.ts 末尾那组用例。
   */
  label: string;
  /** 整页级失败（抓不到 / robots 拦截 / 状态码异常）。有值时该行不展示各维度格子。 */
  blocked: Finding | null;
  cells: Record<Dimension, CompareCell>;
}

export interface CompareTable {
  rows: CompareRow[];
  /** 每个维度有几页处于 attention。纯计数，不是评分。 */
  attentionCount: Record<Dimension, number>;
  /**
   * 每个维度有几页是 unknown（静态检查看不出来）。
   *
   * ⚠️ 单独数出来是**本地走查发现的必要修正**：只报 attention 数时，
   * 「跟踪与同意」这类整列都是 unknown 的维度会显示成「无」，读者会读成
   * 「这项没问题」，而真相是「我们看不出来」——那正是 unknown 这个档次
   * 存在的理由（见 report.ts 顶部），在汇总层把它抹掉等于自毁该设计。
   */
  unknownCount: Record<Dimension, number>;
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * 行标识的首选形态：host + 路径 + query，去掉 www 与光秃秃的根斜杠。
 * 比完整 URL 短（表格第一列很窄），又保住了区分度。
 */
function shortLabelOf(url: string): string {
  try {
    const u = new URL(url);
    // 根路径通常省略，但带 query 时要留着——`a.com?x=1` 读起来像拼错了。
    const path = u.pathname === "/" ? (u.search ? "/" : "") : u.pathname.replace(/\/$/, "");
    return `${hostOf(url)}${path}${u.search}`;
  } catch {
    return url;
  }
}

/**
 * 给每一行定标识：能区分就用短的，不能区分就退回完整 URL。
 *
 * 短标识会丢掉 www 和协议，多数时候无害，但 `a.com` 与 `www.a.com` 是两个真实
 * 不同的落点——一旦折叠到同名，「窄一列」的收益就必须让位于「读者能分清」。
 */
function labelRows(urls: string[]): string[] {
  const short = urls.map(shortLabelOf);
  const seen = new Map<string, number>();
  for (const s of short) seen.set(s, (seen.get(s) ?? 0) + 1);
  return short.map((s, i) => ((seen.get(s) ?? 0) > 1 ? urls[i] : s));
}

/** 同一维度命中多条时取更值得看的那条（attention > unknown > info）。 */
const LEVEL_RANK: Record<FindingLevel, number> = { attention: 0, unknown: 1, info: 2 };

export function buildCompareTable(reports: StoredReport[]): CompareTable {
  const attentionCount = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<
    Dimension,
    number
  >;
  const unknownCount = Object.fromEntries(DIMENSIONS.map((d) => [d, 0])) as Record<
    Dimension,
    number
  >;

  const labels = labelRows(reports.map((r) => r.inputUrl));

  const rows = reports.map((report, index) => {
    const cells = Object.fromEntries(
      DIMENSIONS.map((d) => [d, { finding: null } as CompareCell]),
    ) as Record<Dimension, CompareCell>;

    // 整页级失败优先：这一页根本没检查成，各维度的空白不代表「没问题」。
    const blocked = report.findings.find((f) => UNCOMPARABLE_FINDINGS.has(f.id)) ?? null;

    if (!blocked) {
      for (const finding of report.findings) {
        const dim = FINDING_DIMENSION[finding.id] as Dimension | undefined;
        if (!dim || !(dim in cells)) continue;
        const current = cells[dim].finding;
        if (!current || LEVEL_RANK[finding.level] < LEVEL_RANK[current.level]) {
          cells[dim] = { finding };
        }
      }
      for (const dim of DIMENSIONS) {
        const level = cells[dim].finding?.level;
        if (level === "attention") attentionCount[dim] += 1;
        else if (level === "unknown") unknownCount[dim] += 1;
      }
    }

    return {
      reportId: report.id,
      inputUrl: report.inputUrl,
      host: hostOf(report.inputUrl),
      label: labels[index],
      blocked,
      cells,
    };
  });

  return { rows, attentionCount, unknownCount };
}
