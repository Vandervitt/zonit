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
  // 承接商业意图查询的产品页，权重与模板库同级、高于 anti-ban 这类叙事页。
  [Routes.WhatsAppLanding]: 0.9,
  [Routes.RfqLanding]: 0.9,
  [Routes.AntiBan]: 0.6,
};

/**
 * 尚未国际化的营销页（后续 PR 逐条从这里移入 LOCALIZED_ROUTES）。
 * 与 LOCALIZED_ROUTES 必须互斥——两边都留会让 sitemap 输出重复 URL，
 * 由 lib/i18n/routes.test.ts 的互斥断言守护。
 */
export const PENDING_ROUTES: readonly string[] = [];

/**
 * 不进 sitemap 的已国际化路由：登录/注册页没有搜索价值，列进去只会分走抓取预算。
 * 它们仍留在 LOCALIZED_ROUTES——localePath 与语言切换器需要它们，sitemap 在这里单独排除。
 * 对应地，lib/seo/auth-metadata.ts 给这两页加了 robots noindex，两边口径一致。
 */
export const SITEMAP_EXCLUDED_ROUTES: readonly string[] = ["/login", "/register"];

/**
 * 谷歌已判定不收录的平台页（GSC 2026-11-17 底数，44 条未收录里的 19 条模板面）：
 * 16 张模板详情（10 条 8 月发现至今一次没被抓过，6 条抓了又丢）、1 张行业页、
 * 画廊首页中英文 2 条。路径是语言相关的完整路径（/zh 前缀算在内），只排除
 * 谷歌已判弱的那一侧——另一侧仍被收录的（如 /zh/templates/activewear）不动。
 * 与 robots noindex 口径一致：这里不进 sitemap，页面本身也要输出 noindex，
 * 两边缺一边都会给搜索引擎自相矛盾的信号。
 */
export const NOINDEX_PATHS: readonly string[] = [
  // 画廊首页：中英文都没被抓过（2026-08-19 发现至今）。
  "/templates",
  "/zh/templates",
  // 行业页：supplement 有 5 套模板、本身可索引，但同样没被抓过。
  "/templates/industry/supplement",
  // 模板详情（英文）：已发现未收录 5 条 + 已抓取未收录 6 条。
  "/templates/activewear",
  "/templates/joint",
  "/templates/plus-size",
  "/templates/storage",
  "/templates/vision-correction",
  "/templates/phone-case",
  "/templates/educational-toy",
  "/templates/weight-mgmt",
  "/templates/moving",
  "/templates/study-abroad",
  "/templates/k12-tutoring",
  // 模板详情（中文）：已发现未收录 5 条。
  "/zh/templates/fast-fashion",
  "/zh/templates/footwear",
  "/zh/templates/fragrance",
  "/zh/templates/plus-size",
  "/zh/templates/vision-correction",
];

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
    // hreflang 只挂可索引的语言侧：指向 noindex 页的 alternate 会被谷歌忽略，
    // 还会让它怀疑这组对应关系本身。
    const indexableLocales = locales.filter((l) => !NOINDEX_PATHS.includes(localePath(l, routePath)));
    const languages = Object.fromEntries(
      indexableLocales.map((l) => [hreflang[l], abs(localePath(l, routePath))]),
    );
    for (const l of indexableLocales) {
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
    if (SITEMAP_EXCLUDED_ROUTES.includes(route)) continue;
    // 与 localizedDetailEntries 同理：noindex 的一侧不进 sitemap，hreflang 也不挂它。
    const indexableLocales = locales.filter((l) => !NOINDEX_PATHS.includes(localePath(l, route)));
    if (indexableLocales.length === 0) continue;
    const languages = Object.fromEntries(
      indexableLocales.map((l) => [hreflang[l], abs(localePath(l, route))]),
    );
    const basePriority = PRIORITY[route] ?? 0.7;
    for (const l of indexableLocales) {
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
