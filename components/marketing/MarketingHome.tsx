"use client";

import { useReducedMotion, motion } from "motion/react";
import Link from "next/link";
import {
  Radar,
  ShieldCheck,
  MousePointerClick,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
  Lock,
  LayoutTemplate,
  Pencil,
  Globe,
} from "lucide-react";
import { Routes } from "@/lib/constants";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { ctaPrimary, ctaGhost, gradientText, glassCard, pill, glowAura } from "@/lib/theme";
import { Backdrop, SiteNav, SiteFooter, SectionHead, PricingLink, type Fonts } from "./chrome";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import { useDeferredMotion } from "@/lib/hooks/useDeferredMotion";
import type { Locale } from "@/lib/i18n/config";

/* ------------------------------------------------------------------ *
 * 数据（文案见 lib/i18n/dictionaries 下各语言的 home.ts，此处只留与语言无关的图标与序号）
 * ------------------------------------------------------------------ */

type HomeDict = Dictionary["home"];

// 第三方平台品牌名，不翻译。
const PLATFORMS = [
  "Meta Pixel",
  "Meta CAPI",
  "Google Ads",
  "Google Analytics 4",
  "TikTok Pixel",
  "TikTok Events API",
];

const STEP_ICONS = [LayoutTemplate, Pencil, Globe] as const;
const STEP_NOS = ["01", "02", "03"] as const;

const FEATURE_ICONS = {
  templates: LayoutTemplate,
  editor: Pencil,
  domain: Globe,
  tracking: Radar,
  antiBan: ShieldCheck,
  ai: Sparkles,
} as const;

const FUNNEL_ICONS = {
  consent: Lock,
  pixels: Radar,
  capture: MousePointerClick,
  forwarding: BarChart3,
} as const;

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

// 首屏入场：仅做位移、不做 opacity 淡入。SSR 即以 translateY 渲染出可见文本，
// LCP 的 H1 首帧即可上屏（不必等客户端 JS hydrate 播放动画），hydrate 后滑入到位。
// 位移不计入 CLS。below-fold 区块仍保留 opacity 淡入（whileInView），滚动进入视口时揭示。
const heroRise = {
  hidden: { y: 24 },
  show: { y: 0 },
};

function Hero({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: HomeDict }) {
  return (
    <section className="relative px-6 pt-36 pb-20 sm:pt-44">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="mx-auto max-w-4xl text-center"
      >
        <motion.div variants={heroRise} transition={{ duration: 0.6, ease: "easeOut" }}>
          <span className={`${pill} uppercase tracking-[0.18em] ${fonts.mono}`}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua-500" />
            {t.hero.badge}
          </span>
        </motion.div>

        <motion.h1
          variants={heroRise}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-7 text-4xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-6xl ${fonts.display}`}
        >
          {t.hero.titleLine1}
          <br className="hidden sm:block" />{" "}
          <span className={gradientText}>{t.hero.titleLine2}</span>
        </motion.h1>

        <motion.p
          variants={heroRise}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          variants={heroRise}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href={localePath(locale, Routes.Register)} className={ctaPrimary}>
            {t.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <PricingLink locale={locale} href="#pricing" className={ctaGhost}>
            {t.hero.ctaSecondary}
          </PricingLink>
        </motion.div>

        <motion.p
          variants={heroRise}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-5 text-xs tracking-wide text-muted-foreground/80 ${fonts.mono}`}
        >
          {t.hero.note}
        </motion.p>
      </motion.div>

      <EditorMock fonts={fonts} t={t} />
    </section>
  );
}

/* 悬浮的“编辑器实景”玻璃卡片（明亮净白） */
function EditorMock({ fonts, t }: { fonts: Fonts; t: HomeDict }) {
  const reduce = useReducedMotion();
  const motionReady = useDeferredMotion();
  const animated = !reduce && motionReady;
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
      className="mx-auto mt-16 max-w-4xl [perspective:1200px]"
    >
      <div className={`relative overflow-hidden ${glassCard}`}>
        {/* 浏览器 chrome */}
        <div className="flex items-center gap-3 border-b border-border bg-aqua-50/50 px-4 py-3">
          <div className="flex gap-1.5">
            <span className="h-3 w-3 rounded-full bg-rose-300" />
            <span className="h-3 w-3 rounded-full bg-amber-300" />
            <span className="h-3 w-3 rounded-full bg-emerald-300" />
          </div>
          <div
            className={`mx-auto flex items-center gap-2 rounded-md bg-white px-3 py-1 text-xs text-muted-foreground shadow-sm ${fonts.mono}`}
          >
            <Lock className="h-3 w-3 text-emerald-500" />
            yourbrand.com
          </div>
        </div>
        {/* 模拟落地页 */}
        <div className="grid gap-6 bg-muted p-8 sm:grid-cols-5 sm:p-10">
          <div className="sm:col-span-3">
            <div className="h-2.5 w-24 rounded-full bg-aqua-400" />
            <div className="mt-4 h-7 w-4/5 rounded-lg bg-foreground/15" />
            <div className="mt-2 h-7 w-3/5 rounded-lg bg-gradient-to-r from-aqua-400 to-tech/60" />
            <div className="mt-5 space-y-2">
              <div className="h-2.5 w-full rounded-full bg-aqua-100" />
              <div className="h-2.5 w-11/12 rounded-full bg-aqua-100" />
              <div className="h-2.5 w-3/4 rounded-full bg-aqua-100" />
            </div>
            <div className="mt-6 flex gap-3">
              <div className="h-9 w-32 rounded-lg bg-gradient-to-r from-aqua-600 to-tech" />
              <div className="h-9 w-24 rounded-lg border border-border bg-white" />
            </div>
          </div>
          {/* 留资表单卡 */}
          <div className="rounded-xl border border-border bg-white p-4 shadow-sm sm:col-span-2">
            <div className="h-2.5 w-20 rounded-full bg-aqua-300" />
            <div className="mt-4 space-y-2.5">
              <div className="h-8 rounded-md bg-muted" />
              <div className="h-8 rounded-md bg-muted" />
              <div className="h-8 rounded-md bg-muted" />
              <div className="h-9 rounded-md bg-gradient-to-r from-aqua-600 to-tech" />
            </div>
          </div>
        </div>

        {/* 浮动追踪徽标 */}
        <motion.div
          className={`absolute -right-4 top-20 hidden items-center gap-2 rounded-xl border border-border bg-white/95 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur sm:flex ${fonts.mono}`}
          animate={animated ? { y: [0, -10, 0] } : undefined}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Radar className="h-4 w-4 text-aqua-500" />
          {t.editorMock.pixelBadge}
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        </motion.div>
        <motion.div
          className={`absolute -left-4 bottom-16 hidden items-center gap-2 rounded-xl border border-border bg-white/95 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur sm:flex ${fonts.mono}`}
          animate={animated ? { y: [0, 10, 0] } : undefined}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <MousePointerClick className="h-4 w-4 text-tech" />
          {t.editorMock.leadBadge}
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * 平台跑马灯
 * ------------------------------------------------------------------ */

function LogoMarquee({ fonts, t }: { fonts: Fonts; t: HomeDict }) {
  const reduce = useReducedMotion();
  const motionReady = useDeferredMotion();
  const animated = !reduce && motionReady;
  const items = [...PLATFORMS, ...PLATFORMS];
  return (
    <section className="relative border-y border-border py-10">
      <p className={`mb-6 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground ${fonts.mono}`}>
        {t.marquee.heading}
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          className="flex w-max gap-4"
          animate={animated ? { x: ["0%", "-50%"] } : undefined}
          transition={{ duration: 28, repeat: Infinity, ease: "linear" }}
        >
          {items.map((name, i) => (
            <span
              key={`${name}-${i}`}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-border bg-white px-5 py-2 text-sm text-foreground/70 shadow-sm ${fonts.mono}`}
            >
              <Radar className="h-3.5 w-3.5 text-aqua-500" />
              {name}
            </span>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 三步流程
 * ------------------------------------------------------------------ */

function Steps({ fonts, t }: { fonts: Fonts; t: HomeDict }) {
  return (
    <section className="relative px-6 py-24">
      <SectionHead
        kicker={t.steps.kicker}
        title={t.steps.title}
        desc={t.steps.desc}
        fonts={fonts}
      />
      <div className="relative mx-auto mt-16 max-w-5xl">
        {/* 连接光束 */}
        <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-aqua-300 to-transparent md:block" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {t.steps.items.map(({ title, desc }, i) => {
            const Icon = STEP_ICONS[i];
            const no = STEP_NOS[i];
            return (
            <motion.div
              key={no}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: "easeOut" }}
              className={`relative p-6 ${glassCard}`}
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-aqua-100 bg-aqua-50 text-aqua-600">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`text-3xl font-bold text-aqua-200 ${fonts.display}`}>{no}</span>
              </div>
              <h3 className={`mt-5 text-lg font-semibold text-foreground ${fonts.display}`}>{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 功能网格
 * ------------------------------------------------------------------ */

function Features({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: HomeDict }) {
  // 仅反同质化一项带跳转链接，其余为纯展示卡片。
  const items = (Object.keys(FEATURE_ICONS) as (keyof typeof FEATURE_ICONS)[]).map((key) => {
    const item = t.features.items[key];
    return {
      key,
      Icon: FEATURE_ICONS[key],
      title: item.title,
      desc: item.desc,
      link:
        key === "antiBan"
          ? { href: localePath(locale, Routes.AntiBan), label: t.features.items.antiBan.linkLabel }
          : undefined,
    };
  });

  return (
    <section className="relative px-6 py-24">
      <SectionHead
        kicker={t.features.kicker}
        title={t.features.title}
        desc={t.features.desc}
        fonts={fonts}
      />
      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(({ key, Icon, title, desc, link }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: "easeOut" }}
            className={`group relative p-6 transition-transform hover:-translate-y-1 ${glassCard}`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-aqua-100 bg-aqua-50 text-aqua-600 transition-colors group-hover:bg-aqua-100">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className={`mt-5 text-lg font-semibold text-foreground ${fonts.display}`}>{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            {link && (
              <Link
                href={link.href}
                className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-aqua-600 transition-colors hover:text-aqua-700"
              >
                {link.label}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 数据归因闭环
 * ------------------------------------------------------------------ */

function TrackingShowcase({ fonts, t }: { fonts: Fonts; t: HomeDict }) {
  const funnel = (Object.keys(FUNNEL_ICONS) as (keyof typeof FUNNEL_ICONS)[]).map((key) => ({
    key,
    Icon: FUNNEL_ICONS[key],
    ...t.tracking.funnel[key],
  }));
  return (
    <section className="relative px-6 py-24">
      <div className={`mx-auto max-w-6xl p-8 sm:p-12 ${glassCard}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
              {t.tracking.kicker}
            </span>
            <h2 className={`mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
              {t.tracking.title}
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              {t.tracking.desc}
            </p>
            <ul className="mt-6 space-y-3">
              {t.tracking.bullets.map((bullet) => (
                <li key={bullet} className="flex items-start gap-3 text-sm text-foreground/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-aqua-600" />
                  {bullet}
                </li>
              ))}
            </ul>
          </div>

          {/* 漏斗流程 */}
          <div className="space-y-3">
            {funnel.map(({ key, Icon, label, note }, i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.12, ease: "easeOut" }}
                className="flex items-center gap-4 rounded-xl border border-border bg-white px-5 py-4 shadow-sm"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg border border-aqua-100 bg-aqua-50 text-aqua-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className={`text-xs text-muted-foreground ${fonts.mono}`}>{note}</p>
                </div>
                {i < funnel.length - 1 && (
                  <ArrowRight className="ml-auto h-4 w-4 rotate-90 text-aqua-300" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 定价（融合对比表，复用 PlanComparison 单一数据源）
 * ------------------------------------------------------------------ */

function Pricing({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: HomeDict }) {
  return (
    <section id="pricing" className="relative scroll-mt-24 px-6 py-24">
      <SectionHead
        kicker={t.pricing.kicker}
        title={t.pricing.title}
        desc={t.pricing.desc}
        fonts={fonts}
      />
      <div className="mx-auto mt-16 max-w-6xl">
        <PlanComparison
          locale={locale}
          ctaFor={(planId) => ({
            // 首页两档 CTA 都去注册页——未登录访客无法直接进后台升级。
            href: localePath(locale, Routes.Register),
            label: planId === "free" ? t.pricing.ctaFree : t.pricing.ctaPaid,
          })}
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 结尾 CTA
 * ------------------------------------------------------------------ */

function FinalCTA({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: HomeDict }) {
  return (
    <section className="relative px-6 py-28">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative mx-auto max-w-4xl overflow-hidden px-8 py-16 text-center ${glassCard}`}
      >
        <div className={`pointer-events-none absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 ${glowAura("aqua-400")}`} />
        <Sparkles className="relative mx-auto h-8 w-8 text-aqua-500" />
        <h2 className={`relative mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-5xl ${fonts.display}`}>
          {t.finalCta.titleLine1}
          <br className="hidden sm:block" /> {t.finalCta.titleLine2}
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          {t.finalCta.desc}
        </p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={localePath(locale, Routes.Register)} className={ctaPrimary}>
            {t.finalCta.ctaPrimary}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href={localePath(locale, Routes.Login)} className={ctaGhost}>
            {t.finalCta.ctaSecondary}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 页面装配
 * ------------------------------------------------------------------ */

export default function MarketingHome({ fonts, locale }: { fonts: Fonts; locale: Locale }) {
  const t = getDictionary(locale).home;
  return (
    <div className={`relative min-h-screen bg-background text-foreground ${fonts.body}`}>
      <Backdrop />
      <div className="relative">
        <SiteNav fonts={fonts} locale={locale} />
        <main>
          <Hero fonts={fonts} locale={locale} t={t} />
          <LogoMarquee fonts={fonts} t={t} />
          <Steps fonts={fonts} t={t} />
          <Features fonts={fonts} locale={locale} t={t} />
          <TrackingShowcase fonts={fonts} t={t} />
          <Pricing fonts={fonts} locale={locale} t={t} />
          <FinalCTA fonts={fonts} locale={locale} t={t} />
        </main>
        <SiteFooter fonts={fonts} locale={locale} />
      </div>
    </div>
  );
}
