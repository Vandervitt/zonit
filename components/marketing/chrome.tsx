"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { Zap } from "lucide-react";
import { Routes } from "@/lib/constants";
import { glowAura } from "@/lib/theme";

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
  href = `${Routes.Home}#pricing`,
  className,
  children,
}: {
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
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 细网格 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-aqua-400)_7%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-aqua-400)_7%,transparent)_1px,transparent_1px)] bg-[size:60px_60px] [mask-image:radial-gradient(ellipse_75%_55%_at_50%_0%,black,transparent_72%)]" />
      {/* 轻光感 */}
      <motion.div
        aria-hidden
        className={`absolute -top-48 left-1/2 h-[460px] w-[760px] -translate-x-1/2 ${glowAura("aqua-400")}`}
        animate={reduce ? undefined : { opacity: [0.4, 0.6, 0.4], scale: [1, 1.06, 1] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`absolute top-32 -right-40 h-[380px] w-[380px] ${glowAura("glow-2")}`}
        animate={reduce ? undefined : { x: [0, -40, 0], y: [0, 36, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * 顶部导航
 * ------------------------------------------------------------------ */

export function SiteNav({ fonts }: { fonts: Fonts }) {
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
        <Link href={Routes.Home} className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-aqua-500 to-tech text-white shadow-sm shadow-aqua-500/30">
            <Zap className="h-4 w-4" strokeWidth={2.6} />
          </span>
          <span className={`text-base font-bold tracking-tight text-foreground ${fonts.display}`}>
            Zap Bridge
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href={Routes.AntiBan}
            className="hidden rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-aqua-700 sm:block"
          >
            反同质化
          </Link>
          <PricingLink className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-aqua-700">
            套餐定价
          </PricingLink>
          <Link
            href={Routes.Login}
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-aqua-700"
          >
            登录
          </Link>
          <Link
            href={Routes.Register}
            className="rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-4 py-2 font-medium text-white shadow-sm shadow-aqua-600/25 transition-all hover:brightness-105"
          >
            免费开始
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

export function SiteFooter({ fonts }: { fonts: Fonts }) {
  return (
    <footer className="border-t border-border px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-muted-foreground md:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-aqua-500 to-tech text-white">
            <Zap className="h-3 w-3" strokeWidth={2.6} />
          </span>
          <span className={`font-semibold text-foreground ${fonts.display}`}>Zap Bridge</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href={Routes.AntiBan} className="transition-colors hover:text-aqua-700">
            反同质化
          </Link>
          <PricingLink className="transition-colors hover:text-aqua-700">
            套餐定价
          </PricingLink>
          <Link href={Routes.Privacy} className="transition-colors hover:text-aqua-700">
            隐私政策
          </Link>
          <Link href={Routes.Terms} className="transition-colors hover:text-aqua-700">
            服务条款
          </Link>
          <Link href={Routes.Login} className="transition-colors hover:text-aqua-700">
            登录
          </Link>
          <Link href={Routes.Register} className="transition-colors hover:text-aqua-700">
            免费开始
          </Link>
        </nav>
      </div>
    </footer>
  );
}
