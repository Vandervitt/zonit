"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath, stripLocale, isLocalizedRoute } from "@/lib/i18n/routes";
import { hreflang, LOCALE_COOKIE, type Locale } from "@/lib/i18n/config";

/** 一年有效期，够覆盖一个访客的完整决策周期，又不至于永久锁死。 */
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

/**
 * 语言切换器：URL 仍是渲染语言的唯一事实源，切换本身只是一个普通链接。
 *
 * 额外写一枚 cookie，是为了让首页的 IP 分流（`lib/proxy/locale-proxy.ts`）知道
 * 用户已经手动表过态：没有它，大陆访客点「English」落到 `/` 后一刷新就会被
 * 地理规则弹回 `/zh`，按钮形同虚设。cookie 只影响是否跳转，不参与任何页面渲染。
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
      // 同步写入，早于导航发生；中间件读到的就是这次选择。
      onClick={() => {
        document.cookie = `${LOCALE_COOKIE}=${target}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`;
      }}
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
