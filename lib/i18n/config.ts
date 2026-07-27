// 站点语言基座：仅常量与类型，不依赖任何模块（被 routes / dictionaries / seo 共用）。
// 营销面双语策略见 docs/feat_20260727_营销站国际化/design.md。

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

/** 默认语言占据无前缀根路径，中文走 /zh 前缀。 */
export const defaultLocale: Locale = "en";

/** <html lang> / 嵌套 lang 属性取值。 */
export const htmlLang: Record<Locale, string> = { en: "en", zh: "zh-Hans" };

/** OpenGraph og:locale 取值。 */
export const ogLocale: Record<Locale, string> = { en: "en_US", zh: "zh_CN" };

/** hreflang 取值（x-default 另行指向默认语言）。 */
export const hreflang: Record<Locale, string> = { en: "en", zh: "zh-Hans" };

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
