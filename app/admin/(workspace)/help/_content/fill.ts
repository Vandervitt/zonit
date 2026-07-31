// 帮助中心文案里的 {templates} / {industries} 占位符替换。
//
// 刻意做成只依赖 counts.ts 的纯函数：调用方是 [slug]/page.tsx（服务端组件），
// 由它下传 TEMPLATE_STATS，模板注册表因此不会被拖进帮助中心的客户端 bundle。
// 直接在文案里写死数字是本项目重复犯过三次的错，守卫测试见 content.test.ts。

import { fillTemplateCounts, type TemplateStats } from "@/lib/templates/counts";
import type { HelpBlock, HelpChapterData, HelpSection } from "./types";

function fillBlock(block: HelpBlock, stats: TemplateStats): HelpBlock {
  const f = (text: string) => fillTemplateCounts(text, stats);
  switch (block.t) {
    case "p":
      return { ...block, text: f(block.text) };
    case "callout":
      return { ...block, text: f(block.text) };
    case "list":
      return { ...block, items: block.items.map(f) };
    case "steps":
      return {
        ...block,
        items: block.items.map((s) => ({
          title: f(s.title),
          ...(s.desc === undefined ? {} : { desc: f(s.desc) }),
        })),
      };
    case "table":
      return { ...block, head: block.head.map(f), rows: block.rows.map((r) => r.map(f)) };
    case "faq":
      return { ...block, items: block.items.map((x) => ({ q: f(x.q), a: f(x.a) })) };
  }
}

function fillSection(section: HelpSection, stats: TemplateStats): HelpSection {
  return { ...section, blocks: section.blocks.map((b) => fillBlock(b, stats)) };
}

/** 返回一份占位符已按真实模板口径替换的章节副本，原数据不变。 */
export function fillChapterCounts(
  chapter: HelpChapterData,
  stats: TemplateStats,
): HelpChapterData {
  return {
    ...chapter,
    sections: chapter.sections.map((s) => fillSection(s, stats)),
  };
}
