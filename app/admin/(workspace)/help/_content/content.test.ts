import { describe, expect, it } from "vitest";
import { locales } from "@/lib/i18n/config";
import { getHelpChapters } from ".";
import { PLANS } from "@/lib/plans";

/** 中文侧仍是主内容，既有口径守卫以它为准。 */
const HELP_CHAPTERS = getHelpChapters("zh");
import { fillChapterCounts } from "./fill";
import type { HelpBlock, HelpChapterData } from "./types";

/** 摊平一章里所有会渲染给客户的文本，供全库文案体检。 */
function chapterTexts(chapter: HelpChapterData): string[] {
  const out: string[] = [chapter.title, chapter.summary];
  if (chapter.intro) out.push(chapter.intro);
  for (const section of chapter.sections) {
    out.push(section.heading);
    for (const block of section.blocks) out.push(...blockTexts(block));
  }
  return out;
}

function blockTexts(block: HelpBlock): string[] {
  switch (block.t) {
    case "p":
    case "callout":
      return [block.text];
    case "list":
      return block.items;
    case "steps":
      return block.items.flatMap((s) => (s.desc ? [s.title, s.desc] : [s.title]));
    case "table":
      return [...block.head, ...block.rows.flat()];
    case "faq":
      return block.items.flatMap((x) => [x.q, x.a]);
  }
}

const ALL_TEXTS = HELP_CHAPTERS.flatMap((c) => chapterTexts(c).map((text) => ({ c, text })));

describe("帮助中心文案守卫", () => {
  it("不得写死模板数量，必须用 {templates} / {industries} 占位符", () => {
    // 三次同类事故的根因：数字散落在文案里，加模板时没人记得同步。
    // 占位符由 [slug]/page.tsx 下传 TEMPLATE_STATS 后在渲染时替换，永不脱节。
    const offenders = ALL_TEXTS.filter(({ text }) =>
      /\d+\s*\+?\s*(套|个)?\s*(行业)?\s*(模板|行业模板)/.test(text),
    ).map(({ c, text }) => `${c.slug}: ${text.slice(0, 60)}`);
    expect(offenders).toEqual([]);
  });

  it("不得再宣称一个域名只能承载一张页面", () => {
    // 多路径发布（PR #137-139）上线后，「一域名一页」已是错误描述：
    // 客户读了会以为没有这个能力，新功能等于白做。
    const offenders = ALL_TEXTS.filter(({ text }) =>
      /只承载一张|只能承载一张|一个域名只能发布一张|一域名一 ?offer/.test(text),
    ).map(({ c, text }) => `${c.slug}: ${text.slice(0, 60)}`);
    expect(offenders).toEqual([]);
  });

  it("不得再宣称平台不提供子域托管", () => {
    // 平台子域（PR #145）上线后，「必须自有域名 / 不提供公共子域名托管」已是错误描述：
    // 试用期用户正是靠它在不碰 DNS 的情况下跑通「发布 → 收线索」。
    // 这是第三次同类事故（前两次：一域名一页、写死 30+ 模板），故一并纳入守卫。
    const offenders = ALL_TEXTS.filter(({ text }) =>
      /不提供公共子域|不提供子域|必须用自有域名|必须自有域名|只能发布到你自己/.test(text),
    ).map(({ c, text }) => `${c.slug}: ${text.slice(0, 60)}`);
    expect(offenders).toEqual([]);
  });

  it("占位符不得出现在 title / summary —— 概览页不做替换，会把 {templates} 原样显示给客户", () => {
    const offenders = HELP_CHAPTERS.filter(
      (c) => /\{templates\}|\{industries\}/.test(c.title + c.summary),
    ).map((c) => c.slug);
    expect(offenders).toEqual([]);
  });
});

describe("fillChapterCounts", () => {
  const stats = { templates: 48, industries: 12 };

  it("替换后全库不再残留任何占位符", () => {
    const filled = HELP_CHAPTERS.map((c) => fillChapterCounts(c, stats));
    const leftover = filled.flatMap((c) =>
      chapterTexts(c).filter((t) => /\{templates\}|\{industries\}/.test(t)),
    );
    expect(leftover).toEqual([]);
  });

  it("确实替换出了真实数字（防止替换整个失效而测试仍绿）", () => {
    const source = HELP_CHAPTERS.find((c) => c.slug === "create-pages");
    expect(source).toBeDefined();
    const raw = chapterTexts(source!).join("\n");
    expect(raw).toContain("{templates}");

    const filled = chapterTexts(fillChapterCounts(source!, stats)).join("\n");
    expect(filled).toContain("48 套模板");
    expect(filled).toContain("12 个行业");
  });

  it("不修改原章节数据", () => {
    const source = HELP_CHAPTERS.find((c) => c.slug === "create-pages")!;
    fillChapterCounts(source, stats);
    expect(chapterTexts(source).join("\n")).toContain("{templates}");
  });
});

describe("中英章节对齐", () => {
  it("两种语言的章节数量、顺序与 slug 完全一致", () => {
    // slug 是 URL 的一部分：切语言不该换页，也不该 404。
    const en = getHelpChapters("en").map((c) => c.slug);
    const zh = getHelpChapters("zh").map((c) => c.slug);
    expect(en).toEqual(zh);
  });

  it.each(locales)("%s：每章的 title / summary 都有内容", (locale) => {
    const empty = getHelpChapters(locale)
      .filter((c) => !c.title.trim() || !c.summary.trim())
      .map((c) => c.slug);
    expect(empty).toEqual([]);
  });

  it("同一 slug 下两种语言的小节 id 一致（锚点跨语言可用）", () => {
    const byLocale = Object.fromEntries(
      locales.map((l) => [l, new Map(getHelpChapters(l).map((c) => [c.slug, c.sections.map((s) => s.id)]))]),
    );
    const mismatched = getHelpChapters("zh")
      .filter((c) => JSON.stringify(byLocale.en.get(c.slug)) !== JSON.stringify(byLocale.zh.get(c.slug)))
      .map((c) => c.slug);
    expect(mismatched).toEqual([]);
  });
});

describe("套餐数字不得与 lib/plans.ts 脱节", () => {
  // 「文案与能力脱节」在本项目已复发多次（写死模板数、一域名一页、不提供子域）。
  // 帮助中心的套餐表是最后一处还在手写数字的地方，故用 PLANS 反查锁住。
  //
  // ⚠️ 必须收集**全部**套餐表：getting-started 与 billing 各有一张，
  // 只取第一张的话改坏 billing 不会被发现（本守卫初版就栽在这里）。
  function planRows(locale: "en" | "zh", rowLabel: RegExp): { where: string; cells: string[] }[] {
    const out: { where: string; cells: string[] }[] = [];
    for (const chapter of getHelpChapters(locale)) {
      for (const section of chapter.sections) {
        for (const block of section.blocks) {
          if (block.t !== "table") continue;
          // 必须是「套餐对照表」：表头里出现四个档位名。
          // 否则 "Landing pages" 会先撞上侧边栏导览表的同名行。
          if (!/Free/.test(block.head[1] ?? "")) continue;
          const row = block.rows.find((r) => rowLabel.test(r[0]));
          if (row) out.push({ where: `${chapter.slug}/${section.id}`, cells: row.slice(1) });
        }
      }
    }
    return out;
  }

  const TIERS = [PLANS.free, PLANS.starter, PLANS.pro, PLANS.agency];

  it.each(locales)("%s：落地页数量与 PLANS 的 landingPagesLimit 一致", (locale) => {
    const rows = planRows(locale, locale === "zh" ? /^落地页数量$/ : /^Landing pages$/);
    expect(rows.length, "至少应有两张套餐表（快速上手 + 套餐与账单）").toBeGreaterThanOrEqual(2);
    for (const { where, cells } of rows) {
      TIERS.forEach((plan, i) => {
        // Infinity 那格文案自由（无限 / Unlimited），只校验有限值。
        if (plan.landingPagesLimit !== Infinity) {
          expect(cells[i], `${where} 第 ${i + 1} 档`).toBe(String(plan.landingPagesLimit));
        }
      });
    }
  });

  it.each(locales)("%s：AI 整页生成额度与 PLANS 的 aiPageQuota 一致", (locale) => {
    const rows = planRows(locale, locale === "zh" ? /^AI 整页生成/ : /^AI full-page generations/);
    expect(rows.length).toBeGreaterThanOrEqual(2);
    for (const { where, cells } of rows) {
      expect(cells.slice(0, 4), where).toEqual(TIERS.map((p) => String(p.aiPageQuota)));
    }
  });
});
