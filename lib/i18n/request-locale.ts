import { defaultLocale, isLocale, type Locale } from "./config";

/**
 * 匿名访客的界面语言：用户手动选过（zb_locale cookie）为准；否则看浏览器首选语言；默认英文。
 * 只看首选那一项：把中文列在第二位的人，首选的是别的语言。
 */
export function requestLocale(cookieLocale: string | null | undefined, acceptLanguage: string | null | undefined): Locale {
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;
  const first = acceptLanguage?.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("zh") ? "zh" : defaultLocale;
}
