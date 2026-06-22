// landing-editor/samples/templateFilter.ts
// 画廊筛选：标签中文映射 + 选项去重 + 纯过滤函数。数据源为静态 TEMPLATES，纯前端。
import type { TemplateMeta } from "./registry";

/** 行业 category(slug) → 中文标签。缺键回退原 slug。 */
export const CATEGORY_LABELS: Record<string, string> = {
  beauty: "美妆个护",
  apparel: "服饰配饰",
  gadget: "3C 数码",
  home: "家居家纺",
  supplement: "健康保健",
  "toys-baby": "玩具母婴",
  medical: "医疗",
  "home-improvement": "家装",
};

/** 转化方式 slug → 展示名。缺键回退原 slug。 */
export const CONVERSION_LABELS: Record<string, string> = {
  whatsapp: "WhatsApp",
  form: "表单",
  telegram: "Telegram",
  phone: "电话",
  email: "邮件",
};

const labelOf = (map: Record<string, string>, v: string) => map[v] ?? v;

export interface TemplateFilters {
  category?: string;
  archetype?: string;
  conversion?: string;
  query?: string;
}

export interface FacetOption {
  value: string;
  label: string;
}

export interface FacetOptions {
  category: FacetOption[];
  archetype: FacetOption[];
  conversion: FacetOption[];
}

/** 从实际数据去重生成各维度可选项（保证只列存在的值）。 */
export function facetOptions(metas: TemplateMeta[]): FacetOptions {
  const cat = new Set<string>();
  const arc = new Set<string>();
  const conv = new Set<string>();
  for (const m of metas) {
    cat.add(m.tags.category);
    arc.add(m.tags.archetype);
    for (const c of m.tags.conversion) conv.add(c);
  }
  return {
    category: [...cat].map((v) => ({ value: v, label: labelOf(CATEGORY_LABELS, v) })),
    archetype: [...arc].map((v) => ({ value: v, label: v })),
    conversion: [...conv].map((v) => ({ value: v, label: labelOf(CONVERSION_LABELS, v) })),
  };
}

/** 三维 AND + query 子串匹配（name/tagline/industry）。空/未选维度不约束。 */
export function filterTemplates(metas: TemplateMeta[], f: TemplateFilters): TemplateMeta[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  return metas.filter((m) => {
    if (f.category && m.tags.category !== f.category) return false;
    if (f.archetype && m.tags.archetype !== f.archetype) return false;
    if (f.conversion && !m.tags.conversion.includes(f.conversion as TemplateMeta["tags"]["conversion"][number])) return false;
    if (q) {
      const hay = `${m.name} ${m.tagline} ${m.industry}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
