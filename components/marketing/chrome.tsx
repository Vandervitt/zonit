"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { BrandMark } from "@/components/brand/BrandMark";
import { Routes } from "@/lib/constants";
import { glowAura } from "@/lib/theme";
import { getDictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { isActiveNavRoute } from "@/lib/i18n/nav-active";
import { useDeferredMotion } from "@/lib/hooks/useDeferredMotion";
import type { Locale } from "@/lib/i18n/config";
import { LocaleSwitcher } from "./LocaleSwitcher";

export type Fonts = { display: string; body: string; mono: string };

/** 官网各页共用的入场动画预设 */
export const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

/**
 * 定价区锚点链接。
 * 本页已存在 #pricing 时拦截默认行为、平滑滚动过去——无论地址栏当前 hash 是否已是
 * #pricing（原生 <a> 在 hash 未变化时不会重复滚动，导致“第二次点击不跳转”）。
 * 若当前页没有该区块（如反同质化页），则不拦截，交由 Link 正常跳转到首页定价区。
 */
export function PricingLink({
  locale,
  href = `${localePath(locale, Routes.Home)}#pricing`,
  className,
  children,
}: {
  locale: Locale;
  href?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById("pricing");
    if (!el) return;
    e.preventDefault();
    el.scrollIntoView();
    history.replaceState(null, "", "#pricing");
  };
  return (
    <Link href={href} onClick={onClick} className={className}>
      {children}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * 装饰背景（克制光感 + 细网格）
 * ------------------------------------------------------------------ */

export function Backdrop() {
  const reduce = useReducedMotion();
  // 光斑为全站营销布局共用，循环动画会持续重绘并拖高 Speed Index，故延后到首屏绘制之后。
  const motionReady = useDeferredMotion();
  const animated = !reduce && motionReady;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 细网格 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-aqua-400)_7%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-aqua-400)_7%,transparent)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,black,transparent_72%)]" />
      {/* 轻光感 */}
      <motion.div
        aria-hidden
        className={`absolute -top-48 left-1/2 h-[460px] w-[760px] -translate-x-1/2 ${glowAura("aqua-400")}`}
        // initial 与循环首帧一致，避免动画延迟启动时出现亮度跳变
        initial={{ opacity: 0.4, scale: 1 }}
        animate={animated ? { opacity: [0.4, 0.6, 0.4], scale: [1, 1.06, 1] } : undefined}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`absolute top-32 -right-40 h-[380px] w-[380px] ${glowAura("glow-2")}`}
        animate={animated ? { x: [0, -40, 0], y: [0, 36, 0] } : undefined}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 顶部导航
 * ------------------------------------------------------------------ */

const NAV_LINK_BASE = "rounded-lg px-3 py-2 transition-colors";
const NAV_LINK_IDLE = "text-muted-foreground hover:text-aqua-700";
const NAV_LINK_ACTIVE = "bg-aqua-50 font-medium text-aqua-700";

/** 顶部导航条目：命中当前路由时高亮，并向读屏器暴露 aria-current。 */
function NavLink({
  href,
  active,
  className = "",
  children,
}: {
  href: string;
  active: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={`${NAV_LINK_BASE} ${active ? NAV_LINK_ACTIVE : NAV_LINK_IDLE} ${className}`}
    >
      {children}
    </Link>
  );
}

export function SiteNav({ fonts, locale }: { fonts: Fonts; locale: Locale }) {
  const t = getDictionary(locale).common.nav;
  const pathname = usePathname() ?? "";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        scrolled
          ? "border-b border-border bg-background/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={localePath(locale, Routes.Home)} className="group flex items-center gap-2">
          <BrandMark className="h-8 w-8 rounded-lg shadow-sm shadow-aqua-500/30" />
          <span className={`text-base font-bold tracking-tight text-foreground ${fonts.display}`}>
            Zap Bridge
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <NavLink
            href={localePath(locale, Routes.Templates)}
            active={isActiveNavRoute(pathname, Routes.Templates)}
            className="hidden sm:block"
          >
            {t.templates}
          </NavLink>
          <NavLink
            href={localePath(locale, Routes.Guides)}
            active={isActiveNavRoute(pathname, Routes.Guides)}
            className="hidden sm:block"
          >
            {t.guides}
          </NavLink>
          {/* 反同质化不进一级导航：它对正规品牌客户是负面信号（像给站群批量用的），
              且只有 Agency 档才解锁。入口保留在首页功能区卡片与页脚。 */}
          {/* 定价是首页锚点区（/pricing 独立页不带本导航），没有可点亮的"当前页"语义 */}
          <PricingLink locale={locale} className={`${NAV_LINK_BASE} ${NAV_LINK_IDLE}`}>
            {t.pricing}
          </PricingLink>
          <LocaleSwitcher locale={locale} className={`${NAV_LINK_BASE} ${NAV_LINK_IDLE}`} />
          <NavLink
            href={localePath(locale, Routes.Login)}
            active={isActiveNavRoute(pathname, Routes.Login)}
          >
            {t.login}
          </NavLink>
          <Link
            href={localePath(locale, Routes.Register)}
            className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-4 py-2 font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
          >
            {t.register}
          </Link>
        </nav>
      </div>
    </header>
  );
}

/* ------------------------------------------------------------------ *
 * 区块标题
 * ------------------------------------------------------------------ */

export function SectionHead({
  kicker,
  title,
  desc,
  fonts,
}: {
  kicker: string;
  title: React.ReactNode;
  desc: string;
  fonts: Fonts;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className="mx-auto max-w-2xl text-center"
    >
      <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>{kicker}</span>
      <h2 className={`mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-muted-foreground">{desc}</p>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * 页脚
 * ------------------------------------------------------------------ */

export function SiteFooter({ fonts, locale }: { fonts: Fonts; locale: Locale }) {
  const t = getDictionary(locale).common.footer;
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <BrandMark className="h-6 w-6 rounded-md" />
          <span className={`font-semibold text-foreground ${fonts.display}`}>Zap Bridge</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex flex-wrap items-center justify-center gap-5">
          <Link href={localePath(locale, Routes.Templates)} className="transition-colors hover:text-aqua-700">
            {t.templates}
          </Link>
          {/* 自检器只进页脚，不进主导航：主导航是全站最贵的位置，
              「自检 / 体检」对不投放的访客是陌生动作，摆在顶部会把产品重新框成
              诊断工具。页脚保证全站可达，真正的导流靠合规簇文章与首页归因区。 */}
          <Link href={localePath(locale, Routes.PageCheck)} className="transition-colors hover:text-aqua-700">
            {t.pageCheck}
          </Link>
          <Link href={localePath(locale, Routes.AntiBan)} className="transition-colors hover:text-aqua-700">
            {t.antiBan}
          </Link>
          <PricingLink locale={locale} className="transition-colors hover:text-aqua-700">
            {t.pricing}
          </PricingLink>
          <Link href={localePath(locale, Routes.Privacy)} className="transition-colors hover:text-aqua-700">
            {t.privacy}
          </Link>
          <Link href={localePath(locale, Routes.Terms)} className="transition-colors hover:text-aqua-700">
            {t.terms}
          </Link>
          <Link href={localePath(locale, Routes.Login)} className="transition-colors hover:text-aqua-700">
            {t.login}
          </Link>
          <Link href={localePath(locale, Routes.Register)} className="transition-colors hover:text-aqua-700">
            {t.register}
          </Link>
          <LocaleSwitcher locale={locale} className="transition-colors hover:text-aqua-700" />
        </nav>
      </div>
    </footer>
  );
}
