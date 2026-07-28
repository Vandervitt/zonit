// landing-editor/samples/templateFilter.ts
// 画廊筛选：标签展示名 + 选项去重 + 纯过滤函数。数据源为静态 TEMPLATES，纯前端。
// 展示名统一取自 lib/i18n/dictionaries 下各语言的 templates.ts，本文件不再自带中文映射。
import type { TemplateMeta } from "./registry";
import { getDictionary } from "@/lib/i18n/dictionaries";
import type { Locale } from "@/lib/i18n/config";

type LabelMap = Record<string, string | undefined>;

/** 缺键回退原 slug，保证新增标签值不会渲染成空白。 */
const labelOf = (map: LabelMap, v: string) => map[v] ?? v;

/** 行业大类展示名。 */
export function categoryLabel(locale: Locale, v: string): string {
  return labelOf(getDictionary(locale).templates.category, v);
}

/** 转化渠道展示名。 */
export function conversionLabel(locale: Locale, v: string): string {
  return labelOf(getDictionary(locale).templates.conversion, v);
}

/** 页面范式展示名（数据键为英文 slug）。 */
export function archetypeLabel(locale: Locale, v: string): string {
  return labelOf(getDictionary(locale).templates.archetype, v);
}

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
export function facetOptions(metas: TemplateMeta[], locale: Locale = "en"): FacetOptions {
  const cat = new Set<string>();
  const arc = new Set<string>();
  const conv = new Set<string>();
  for (const m of metas) {
    cat.add(m.tags.category);
    arc.add(m.tags.archetype);
    for (const c of m.tags.conversion) conv.add(c);
  }
  return {
    category: [...cat].map((v) => ({ value: v, label: categoryLabel(locale, v) })),
    archetype: [...arc].map((v) => ({ value: v, label: archetypeLabel(locale, v) })),
    conversion: [...conv].map((v) => ({ value: v, label: conversionLabel(locale, v) })),
  };
}

/**
 * 三维 AND + query 子串匹配（name/tagline/industry）。空/未选维度不约束。
 * query 只搜当前语言的可见文案——搜到看不见的文字会让结果无法解释。
 */
export function filterTemplates(
  metas: TemplateMeta[],
  f: TemplateFilters,
  locale: Locale = "en",
): TemplateMeta[] {
  const q = f.query?.trim().toLowerCase() ?? "";
  return metas.filter((m) => {
    if (f.category && m.tags.category !== f.category) return false;
    if (f.archetype && m.tags.archetype !== f.archetype) return false;
    if (f.conversion && !m.tags.conversion.includes(f.conversion as TemplateMeta["tags"]["conversion"][number])) return false;
    if (q) {
      const hay = `${m.name} ${m.tagline[locale]} ${m.industry[locale]}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
