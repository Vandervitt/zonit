// 营销面路由清单——本文件是「哪些路由参与国际化」的唯一事实源，同时驱动：
// ① localePath 的合法性守卫 ② sitemap 双语条目 ③ app/zh 镜像对等性测试 ④ 语言切换器可见性。
import { defaultLocale, type Locale } from "./config";

export const ZH_PREFIX = "/zh";

/**
 * 已完成国际化的营销路由。
 * **只登记「app/zh 镜像已存在」的路由**：提前登记会让 localePath 产出尚不存在的
 * /zh/xxx 地址，把中文页导航直接链到 404。后续 PR 上线一页就追加一条。
 */
export const LOCALIZED_ROUTES = [
  "/",
  "/pricing",
  "/anti-ban",
  "/login",
  "/register",
  "/templates",
  "/guides",
  "/tools/landing-page-check",
  "/privacy",
  "/terms",
] as const;

/**
 * 已完成国际化的动态子树前缀：其下任意子路径都参与国际化（如 /templates/<id>）。
 * 同样只登记镜像已存在的前缀——PR 3 上模板画廊时加 "/templates"，PR 4 上指南时加 "/guides"。
 */
export const LOCALIZED_PREFIXES: readonly string[] = ["/templates", "/guides", "/tools/landing-page-check"];

/** 分离出路径主体与 hash/query 后缀，避免把前缀插到 # 或 ? 后面。 */
function splitSuffix(path: string): [string, string] {
  const i = path.search(/[#?]/);
  return i === -1 ? [path, ""] : [path.slice(0, i), path.slice(i)];
}

export function isLocalizedRoute(path: string): boolean {
  const [pathname] = splitSuffix(path);
  if ((LOCALIZED_ROUTES as readonly string[]).includes(pathname)) return true;
  return LOCALIZED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * 给营销路由加语言前缀。
 * 非营销路由（/admin、/api、/p 等）与尚未镜像的营销页原样返回——它们没有 /zh 镜像，
 * 加前缀必然 404。
 */
export function localePath(locale: Locale, path: string): string {
  if (!isLocalizedRoute(path)) return path;
  if (locale === defaultLocale) return path;
  const [pathname, suffix] = splitSuffix(path);
  const base = pathname === "/" ? ZH_PREFIX : `${ZH_PREFIX}${pathname}`;
  return `${base}${suffix}`;
}

/** 从实际 URL 路径反解语言与去前缀路径（供语言切换器使用）。 */
export function stripLocale(path: string): { locale: Locale; pathname: string } {
  const [pathname, suffix] = splitSuffix(path);
  if (pathname === ZH_PREFIX) return { locale: "zh", pathname: `/${suffix}` };
  if (pathname.startsWith(`${ZH_PREFIX}/`)) {
    return { locale: "zh", pathname: `${pathname.slice(ZH_PREFIX.length)}${suffix}` };
  }
  return { locale: defaultLocale, pathname: `${pathname}${suffix}` };
}
