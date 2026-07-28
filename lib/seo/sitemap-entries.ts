// 平台主域营销面的 sitemap 条目（纯函数，便于测试）。
// 已进入 LOCALIZED_ROUTES 的路由出双语两条并互挂 hreflang；
// 尚未国际化的页面只出当前路径单条——不伪造 /zh 链接，否则 sitemap 会指向 404，损伤收录。
import type { MetadataRoute } from "next";
import { locales, hreflang, defaultLocale } from "@/lib/i18n/config";
import { LOCALIZED_ROUTES, localePath } from "@/lib/i18n/routes";
import { Routes } from "@/lib/constants";

const PRIORITY: Record<string, number> = {
  "/": 1,
  [Routes.Templates]: 0.9,
  [Routes.Pricing]: 0.8,
  [Routes.Guides]: 0.8,
  [Routes.AntiBan]: 0.6,
};

/**
 * 尚未国际化的营销页（后续 PR 逐条从这里移入 LOCALIZED_ROUTES）。
 * 与 LOCALIZED_ROUTES 必须互斥——两边都留会让 sitemap 输出重复 URL，
 * 由 lib/i18n/routes.test.ts 的互斥断言守护。
 */
export const PENDING_ROUTES: readonly string[] = [];

/**
 * 已国际化的动态详情页（如 33 个模板详情）：每条出双语两条并互挂 hreflang。
 * routePath 须落在 LOCALIZED_PREFIXES 之下，否则 localePath 会原样返回，两条 URL 撞车。
 */
export function localizedDetailEntries(
  base: string,
  paths: { routePath: string; lastModified: Date }[],
  priority = 0.7,
): MetadataRoute.Sitemap {
  const abs = (p: string) => `${base}${p}`;
  const entries: MetadataRoute.Sitemap = [];
  for (const { routePath, lastModified } of paths) {
    const languages = Object.fromEntries(
      locales.map((l) => [hreflang[l], abs(localePath(l, routePath))]),
    );
    for (const l of locales) {
      entries.push({
        url: abs(localePath(l, routePath)),
        lastModified,
        changeFrequency: "monthly",
        priority: l === defaultLocale ? priority : Number((priority * 0.9).toFixed(2)),
        alternates: { languages },
      });
    }
  }
  return entries;
}

export function marketingEntries(base: string, now: Date): MetadataRoute.Sitemap {
  const abs = (path: string) => (path === "/" ? `${base}/` : `${base}${path}`);
  const entries: MetadataRoute.Sitemap = [];

  for (const route of LOCALIZED_ROUTES) {
    const languages = Object.fromEntries(
      locales.map((l) => [hreflang[l], abs(localePath(l, route))]),
    );
    const basePriority = PRIORITY[route] ?? 0.7;
    for (const l of locales) {
      entries.push({
        url: abs(localePath(l, route)),
        lastModified: now,
        changeFrequency: "weekly",
        // 非默认语言轻微降权，避免与默认语言页面在同一权重上互相稀释。
        priority: l === defaultLocale ? basePriority : Number((basePriority * 0.9).toFixed(2)),
        alternates: { languages },
      });
    }
  }

  for (const route of PENDING_ROUTES) {
    entries.push({
      url: abs(route),
      lastModified: now,
      changeFrequency: "monthly",
      priority: PRIORITY[route] ?? 0.7,
    });
  }

  return entries;
}
