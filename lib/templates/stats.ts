// 模板库口径统计：模板数与行业数的唯一事实源。
//
// 营销文案里的「N 套模板 / 覆盖 M 个行业」一律写成 {templates} / {industries} 占位符，
// 由本模块在渲染时按注册表实际内容替换——避免每加一套模板就要人肉同步一遍散落各处的数字
// （历史上文案长期停留在 "30+"，而注册表已有 48 套、12 个行业）。
//
// 本模块会把 registry 拉进模块图，只在服务端组件 / metadata 工厂中使用；
// 客户端组件请 import lib/templates/counts.ts 的纯函数，数量由服务端下传。

import { TEMPLATES } from "@/landing-editor/samples/registry";
import { fillTemplateCounts, type TemplateStats } from "./counts";

export type { TemplateStats };

const WHATSAPP_TEMPLATES = TEMPLATES.filter((t) => t.tags.conversion.includes("whatsapp"));

export const TEMPLATE_STATS: TemplateStats = {
  templates: TEMPLATES.length,
  industries: new Set(TEMPLATES.map((t) => t.tags.category)).size,
  whatsappTemplates: WHATSAPP_TEMPLATES.length,
  whatsappIndustries: new Set(WHATSAPP_TEMPLATES.map((t) => t.tags.category)).size,
};

/** 按注册表真实口径替换 `{templates}` / `{industries}` 占位符。 */
export function fillCounts(text: string): string {
  return fillTemplateCounts(text, TEMPLATE_STATS);
}

/** 行业大类及其模板数，按注册表出现顺序（与模板画廊分组顺序一致）。 */
export function templateIndustries(): { category: string; count: number }[] {
  const out: { category: string; count: number }[] = [];
  for (const t of TEMPLATES) {
    const hit = out.find((x) => x.category === t.tags.category);
    if (hit) hit.count += 1;
    else out.push({ category: t.tags.category, count: 1 });
  }
  return out;
}
