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
  /** 转化渠道含 WhatsApp 的模板数（tags.conversion 包含 "whatsapp"）。 */
  whatsappTemplates: number;
  /** 上述模板覆盖的行业大类数——恒 ≤ industries。 */
  whatsappIndustries: number;
}

/**
 * 把文案中的数量占位符替换为真实数量。
 * 支持 `{templates}` / `{industries}` / `{whatsappTemplates}` / `{whatsappIndustries}`。
 *
 * ⚠️ 替换顺序有讲究：`{whatsappTemplates}` 必须先于 `{templates}` 替换。
 * 否则不会出错（两者是不同的完整 token），但如果将来有人加了 `{templatesFoo}`
 * 这类前缀重叠的占位符，短 token 先替换会把长 token 咬掉一半。
 */
export function fillTemplateCounts(text: string, stats: TemplateStats): string {
  return text
    .replaceAll("{whatsappTemplates}", String(stats.whatsappTemplates))
    .replaceAll("{whatsappIndustries}", String(stats.whatsappIndustries))
    .replaceAll("{templates}", String(stats.templates))
    .replaceAll("{industries}", String(stats.industries));
}
