"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath, stripLocale } from "@/lib/i18n/routes";
import { hreflang, type Locale } from "@/lib/i18n/config";

/**
 * 语言切换器：URL 是语言的唯一事实源。
 * 不写 cookie、不做 Accept-Language 自动重定向——自动重定向会让爬虫按出口 IP
 * 拿到非预期语言版本，污染 canonical / hreflang 信号（见设计文档 §4.5）。
 */
export function LocaleSwitcher({ locale, className }: { locale: Locale; className?: string }) {
  const pathname = usePathname();
  const { pathname: bare } = stripLocale(pathname ?? "/");
  const target: Locale = locale === "en" ? "zh" : "en";
  const t = getDictionary(locale).common.localeSwitcher;

  return (
    <Link
      href={localePath(target, bare)}
      hrefLang={hreflang[target]}
      aria-label={t.ariaLabel}
      className={className}
    >
      {target === "en" ? t.toEn : t.toZh}
    </Link>
  );
}
