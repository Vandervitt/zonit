// 行业中间层：把 tags.category 从「画廊页锚点」升格为一等实体。
//
// 背景：钱词落在行业层（"dental clinic landing page template"），而此前站点只有
// 1 张画廊页 + 52 张单模板页，中间层缺失——52 张详情页彼此竞争同一批行业词。
// 本模块是行业分组的唯一事实源，供行业页 SSG、面包屑、sitemap 与画廊分组共用。
import { TEMPLATES, type TemplateMeta } from "@/landing-editor/samples/registry";

/**
 * 行业页可被索引的最低模板数。
 * 只有 1 套模板的行业，其行业页内容与那唯一一张详情页高度重合——放出去等于
 * 自造重复页。这类行业照常可访问、可内链，但输出 noindex 且不进 sitemap，
 * 待模板补齐后自动转为可索引（阈值判定按注册表实时计算，无需改代码）。
 */
export const INDEXABLE_MIN_TEMPLATES = 2;

export interface IndustryGroup {
  category: string;
  items: TemplateMeta[];
}

/** 按注册表出现顺序稳定分组，与模板画廊的分组顺序一致。 */
export function industryGroups(): IndustryGroup[] {
  const groups: IndustryGroup[] = [];
  for (const t of TEMPLATES) {
    const hit = groups.find((g) => g.category === t.tags.category);
    if (hit) hit.items.push(t);
    else groups.push({ category: t.tags.category, items: [t] });
  }
  return groups;
}

/** 全部行业 slug（= 行业页的 SSG 参数集合）。 */
export function industryCategories(): string[] {
  return industryGroups().map((g) => g.category);
}

/** 某行业下的模板；未知行业返回空数组（由调用方 notFound）。 */
export function templatesInIndustry(category: string): TemplateMeta[] {
  return TEMPLATES.filter((t) => t.tags.category === category);
}

/** 该行业页是否值得放给搜索引擎收录（见 INDEXABLE_MIN_TEMPLATES）。 */
export function isIndexableIndustry(category: string): boolean {
  return templatesInIndustry(category).length >= INDEXABLE_MIN_TEMPLATES;
}

/** 可索引的行业 slug——sitemap 只收这批。 */
export function indexableIndustryCategories(): string[] {
  return industryCategories().filter(isIndexableIndustry);
}
