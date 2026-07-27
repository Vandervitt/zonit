"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Fingerprint,
  ShieldCheck,
  RefreshCw,
  Layers,
  Boxes,
  Ban,
  TrendingDown,
  Link2,
  ScanSearch,
  Check,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Routes } from "@/lib/constants";
import { Backdrop, SiteNav, SiteFooter, SectionHead, PricingLink, fadeUp, type Fonts } from "./chrome";
import { ctaPrimary, ctaGhost, gradientText, glassCard, pill, glowAura } from "@/lib/theme";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { localePath } from "@/lib/i18n/routes";
import type { Locale } from "@/lib/i18n/config";

/* ------------------------------------------------------------------ *
 * 数据（文案见 lib/i18n/dictionaries 下各语言的 antiban.ts，此处只留图标映射）
 * ------------------------------------------------------------------ */

type AntiBanDict = Dictionary["antiban"];

// 广告主的三重恐惧：同模板 → 查重 → 处置。
const FEAR_ICONS = { review: ScanSearch, throttle: TrendingDown, chainBan: Link2 } as const;

// 引擎的工作机制（与实际实现对齐：种子化确定性 variant）。
const MECHANISM_ICONS = { dom: Boxes, salt: Fingerprint, layout: Layers, deterministic: RefreshCw } as const;

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

function Hero({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: AntiBanDict }) {
  return (
    <section className="relative px-6 pt-36 pb-16 sm:pt-44">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="mx-auto max-w-3xl text-center"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: "easeOut" }}>
          <span className={`${pill} uppercase tracking-[0.18em] ${fonts.mono}`}>
            <Ban className="h-3.5 w-3.5" />
            {t.hero.badge}
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-7 text-4xl font-bold leading-[1.14] tracking-tight text-foreground sm:text-6xl ${fonts.display}`}
        >
          {t.hero.titleLine1}
          <br className="hidden sm:block" />{" "}
          <span className={gradientText}>{t.hero.titleLine2}</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          {t.hero.subtitle}
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href={localePath(locale, Routes.Register)} className={ctaPrimary}>
            {t.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <PricingLink locale={locale} className={ctaGhost}>
            {t.hero.ctaSecondary}
          </PricingLink>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 恐惧：同模板的连环风险
 * ------------------------------------------------------------------ */

function Fears({ fonts, t }: { fonts: Fonts; t: AntiBanDict }) {
  const items = (Object.keys(FEAR_ICONS) as (keyof typeof FEAR_ICONS)[]).map((key) => ({
    key,
    Icon: FEAR_ICONS[key],
    ...t.fears.items[key],
  }));
  return (
    <section className="relative px-6 py-20">
      <SectionHead
        kicker={t.fears.kicker}
        title={t.fears.title}
        desc={t.fears.desc}
        fonts={fonts}
      />
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {items.map(({ key, Icon, title, desc }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
            className={`relative p-6 ${glassCard}`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-rose-100 bg-rose-50 text-rose-500">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className={`mt-5 text-lg font-semibold text-foreground ${fonts.display}`}>{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 引擎机制
 * ------------------------------------------------------------------ */

function Mechanisms({ fonts, t }: { fonts: Fonts; t: AntiBanDict }) {
  const items = (Object.keys(MECHANISM_ICONS) as (keyof typeof MECHANISM_ICONS)[]).map((key) => ({
    key,
    Icon: MECHANISM_ICONS[key],
    ...t.mechanisms.items[key],
  }));
  return (
    <section className="relative px-6 py-24">
      <SectionHead
        kicker={t.mechanisms.kicker}
        title={t.mechanisms.title}
        desc={t.mechanisms.desc}
        fonts={fonts}
      />
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2">
        {items.map(({ key, Icon, title, desc }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: (i % 2) * 0.1, ease: "easeOut" }}
            className={`group relative p-6 transition-transform hover:-translate-y-1 ${glassCard}`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-aqua-100 bg-aqua-50 text-aqua-600 transition-colors group-hover:bg-aqua-100">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className={`mt-5 text-lg font-semibold text-foreground ${fonts.display}`}>{title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 合规边界：这不是 cloaking
 * ------------------------------------------------------------------ */

function Ethics({ fonts, t }: { fonts: Fonts; t: AntiBanDict }) {
  return (
    <section className="relative px-6 py-20">
      <div className={`mx-auto max-w-4xl p-8 sm:p-12 ${glassCard}`}>
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h2 className={`mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl ${fonts.display}`}>
          {t.ethics.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {t.ethics.desc}
        </p>
        <ul className="mt-6 space-y-3">
          {t.ethics.points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * Agency 门控 + 结尾 CTA
 * ------------------------------------------------------------------ */

function AgencyCta({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: AntiBanDict }) {
  return (
    <section className="relative px-6 py-24">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`relative mx-auto max-w-4xl overflow-hidden px-8 py-16 text-center ${glassCard}`}
      >
        <div className={`pointer-events-none absolute left-1/2 top-0 h-56 w-96 -translate-x-1/2 ${glowAura("aqua-400")}`} />
        <Sparkles className="relative mx-auto h-8 w-8 text-aqua-500" />
        <h2 className={`relative mt-5 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
          {t.agencyCta.title}
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          {t.agencyCta.desc}
        </p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <PricingLink locale={locale} className={ctaPrimary}>
            {t.agencyCta.ctaPrimary}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </PricingLink>
          <Link href={localePath(locale, Routes.Register)} className={ctaGhost}>
            {t.agencyCta.ctaSecondary}
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 页面装配
 * ------------------------------------------------------------------ */

export default function AntiBanNarrative({ fonts, locale }: { fonts: Fonts; locale: Locale }) {
  const t = getDictionary(locale).antiban;
  return (
    <div className={`relative min-h-screen bg-background text-foreground ${fonts.body}`}>
      <Backdrop />
      <div className="relative">
        <SiteNav fonts={fonts} locale={locale} />
        <main>
          <Hero fonts={fonts} locale={locale} t={t} />
          <Fears fonts={fonts} t={t} />
          <Mechanisms fonts={fonts} t={t} />
          <Ethics fonts={fonts} t={t} />
          <AgencyCta fonts={fonts} locale={locale} t={t} />
        </main>
        <SiteFooter fonts={fonts} locale={locale} />
      </div>
    </div>
  );
}
