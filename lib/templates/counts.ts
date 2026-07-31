// 模板数量占位符替换（纯函数，刻意不 import registry）。
//
// 客户端组件（MarketingHome 等）只 import 本模块，数量由上层服务端组件下传，
// 这样 48 套模板的元数据不会因为一句文案被拖进客户端 bundle。
// 服务端侧请用 lib/templates/stats.ts 的 TEMPLATE_STATS / fillCounts。

export interface TemplateStats {
  /** 模板总数。 */
  templates: number;
  /** 行业大类数（registry 中出现过的 tags.category 去重计数）。 */
  industries: number;
}

/** 把文案中的 `{templates}` / `{industries}` 占位符替换为真实数量。 */
export function fillTemplateCounts(text: string, stats: TemplateStats): string {
  return text
    .replaceAll("{templates}", String(stats.templates))
    .replaceAll("{industries}", String(stats.industries));
}
