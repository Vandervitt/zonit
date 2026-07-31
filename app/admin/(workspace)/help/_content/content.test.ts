import { describe, expect, it } from "vitest";
import { HELP_CHAPTERS } from ".";
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
