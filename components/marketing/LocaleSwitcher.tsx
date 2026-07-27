"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath, stripLocale, isLocalizedRoute } from "@/lib/i18n/routes";
import { hreflang, type Locale } from "@/lib/i18n/config";

/**
 * 语言切换器：URL 是语言的唯一事实源。
 * 不写 cookie、不做 Accept-Language 自动重定向——自动重定向会让爬虫按出口 IP
 * 拿到非预期语言版本，污染 canonical / hreflang 信号（见设计文档 §4.5）。
 */
export function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const { pathname: bare } = stripLocale(pathname ?? "/");

  // 分期交付期间，尚未有 /zh 镜像的页面（/guides、/templates 等）不显示切换器：
  // 那里 localePath 会原样返回当前路径，按钮点了等于原地刷新，是个死链接。
  // 各页在自己的 PR 里进入 LOCALIZED_ROUTES 后，切换器自动出现。
  if (!isLocalizedRoute(bare)) return null;

  const target: Locale = locale === "en" ? "zh" : "en";
  const t = getDictionary(locale).common.localeSwitcher;
  const label = target === "en" ? t.toEn : t.toZh;

  return (
    <Link
      href={localePath(target, bare)}
      hrefLang={hreflang[target]}
      // 可访问名必须包含可见文本（WCAG 2.5.3 Label in Name）：
      // 只写 aria-label="Switch language" 会盖掉可见的「中文」，
      // 使语音控制用户无法用看到的词触达该链接。
      aria-label={`${t.ariaLabel}: ${label}`}
      className={className}
    >
      {label}
    </Link>
  );
}
