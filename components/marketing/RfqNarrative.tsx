"use client";

import Link from "next/link";
import { motion } from "motion/react";
import {
  Factory,
  House,
  FileQuestion,
  FileSearch,
  Languages,
  ClipboardList,
  ScrollText,
  Check,
  ArrowRight,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { Routes, templateIndustryPath } from "@/lib/constants";
import { RFQ_GUIDE_SLUG, RFQ_PRIMARY_TEMPLATE } from "@/lib/marketing/rfq";
import { Backdrop, SiteNav, SiteFooter, SectionHead, PricingLink, fadeUp, type Fonts } from "./chrome";
import { ctaPrimary, ctaGhost, gradientText, glassCard, pill, glowAura } from "@/lib/theme";
import { getDictionary, type Dictionary } from "@/lib/i18n/dictionaries";
import { fillTemplateCounts, type TemplateStats } from "@/lib/templates/counts";
import { localePath } from "@/lib/i18n/routes";
import { guideDetailPath } from "@/lib/constants";
import type { Locale } from "@/lib/i18n/config";

/* ------------------------------------------------------------------ *
 * 外贸询盘落地页产品页。结构与 WhatsAppNarrative 一致（两者同属「产品页」），
 * 文案见 lib/i18n/dictionaries 下各语言的 rfq.ts，此处只留图标映射与链接。
 * ------------------------------------------------------------------ */

type RfqDict = Dictionary["rfq"];
type Fill = (text: string) => string;

// 询盘丢失的三处：落点 → 可报价 → 审核。
const PROBLEM_ICONS = { homepage: House, unquotable: FileQuestion, review: FileSearch } as const;

// 产品侧的四项能力（与实际实现对齐：AI 生成 / 询价表单 / 能力前置的模板 / 合规子页）。
const BUILD_ICONS = { brief: Languages, form: ClipboardList, capability: Factory, compliance: ScrollText } as const;

/**
 * 主 CTA 直达「用该模板建页」：未登录会带着回跳去登录（中文来源进中文登录页），
 * 登录后直接落在已套用模板的编辑器——比先进模板详情页再点一次少一步。
 */
const START_WITH_TEMPLATE = `${Routes.LandingPages}?template=${RFQ_PRIMARY_TEMPLATE}`;
const B2B_TEMPLATES = templateIndustryPath("b2b");

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

function Hero({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: RfqDict }) {
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
            <Factory className="h-3.5 w-3.5" />
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
          <Link href={START_WITH_TEMPLATE} className={ctaPrimary}>
            {t.hero.ctaPrimary}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href={localePath(locale, B2B_TEMPLATES)} className={ctaGhost}>
            {t.hero.ctaSecondary}
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 问题：询盘丢在哪
 * ------------------------------------------------------------------ */

function Problem({ fonts, t }: { fonts: Fonts; t: RfqDict }) {
  const items = (Object.keys(PROBLEM_ICONS) as (keyof typeof PROBLEM_ICONS)[]).map((key) => ({
    key,
    Icon: PROBLEM_ICONS[key],
    ...t.problem.items[key],
  }));
  return (
    <section className="relative px-6 py-20">
      <SectionHead kicker={t.problem.kicker} title={t.problem.title} desc={t.problem.desc} fonts={fonts} />
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
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-amber-100 bg-amber-50 text-amber-600">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className={`mt-5 text-lg font-semibold text-foreground ${fonts.display}`}>{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 能力：一张专门接询价的英文页面
 * ------------------------------------------------------------------ */

function Build({ fonts, t }: { fonts: Fonts; t: RfqDict }) {
  const items = (Object.keys(BUILD_ICONS) as (keyof typeof BUILD_ICONS)[]).map((key) => ({
    key,
    Icon: BUILD_ICONS[key],
    ...t.build.items[key],
  }));
  return (
    <section className="relative px-6 py-20">
      <SectionHead kicker={t.build.kicker} title={t.build.title} desc={t.build.desc} fonts={fonts} />
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-2">
        {items.map(({ key, Icon, title, desc }, i) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
            className={`relative p-6 ${glassCard}`}
          >
            <span className="grid h-11 w-11 place-items-center rounded-xl border border-aqua-100 bg-aqua-50 text-aqua-600">
              <Icon className="h-5 w-5" />
            </span>
            <h3 className={`mt-5 text-lg font-semibold text-foreground ${fonts.display}`}>{title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 计数口径澄清：询价（表单）才是线索，WhatsApp / 电话只是点击。
 * B2B 模板普遍挂了 WhatsApp 作次通道，不讲清楚客户会把两个数加在一起。
 * ------------------------------------------------------------------ */

function Measurement({ fonts, t }: { fonts: Fonts; t: RfqDict }) {
  return (
    <section className="relative px-6 py-20">
      <div className={`mx-auto max-w-4xl p-8 sm:p-12 ${glassCard}`}>
        <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
          {t.measurement.kicker}
        </span>
        <h2 className={`mt-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl ${fonts.display}`}>
          {t.measurement.title}
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">{t.measurement.desc}</p>
        <ul className="mt-6 space-y-3">
          {t.measurement.points.map((point) => (
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
 * 模板出口
 * ------------------------------------------------------------------ */

function Templates({
  fonts,
  locale,
  t,
  fill,
}: {
  fonts: Fonts;
  locale: Locale;
  t: RfqDict;
  fill: Fill;
}) {
  return (
    <section className="relative px-6 py-20">
      <SectionHead
        kicker={t.templates.kicker}
        title={fill(t.templates.title)}
        desc={fill(t.templates.desc)}
        fonts={fonts}
      />
      <div className="mt-10 flex justify-center">
        <Link href={localePath(locale, B2B_TEMPLATES)} className={ctaGhost}>
          {t.templates.cta}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 指向信息型长文的出口（两页分工的另一端）
 * ------------------------------------------------------------------ */

function GuideLink({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: RfqDict }) {
  return (
    <section className="relative px-6 pb-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`mx-auto flex max-w-4xl flex-col gap-5 p-8 sm:flex-row sm:items-center sm:justify-between ${glassCard}`}
      >
        <div className="sm:max-w-xl">
          <h2 className={`text-xl font-semibold text-foreground ${fonts.display}`}>{t.guide.title}</h2>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{t.guide.desc}</p>
        </div>
        <Link
          href={localePath(locale, guideDetailPath(RFQ_GUIDE_SLUG))}
          className={`${ctaGhost} shrink-0`}
        >
          <BookOpen className="h-4 w-4" />
          {t.guide.cta}
        </Link>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 结尾 CTA
 * ------------------------------------------------------------------ */

function FinalCta({ fonts, locale, t }: { fonts: Fonts; locale: Locale; t: RfqDict }) {
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
          {t.finalCta.title}
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          {t.finalCta.desc}
        </p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={localePath(locale, Routes.Register)} className={ctaPrimary}>
            {t.finalCta.ctaPrimary}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <PricingLink locale={locale} className={ctaGhost}>
            {t.finalCta.ctaSecondary}
          </PricingLink>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 页面装配
 * ------------------------------------------------------------------ */

export default function RfqNarrative({
  fonts,
  locale,
  stats,
}: {
  fonts: Fonts;
  locale: Locale;
  /** 模板库口径，由服务端页面按注册表算好下传（避免注册表进客户端 bundle）。 */
  stats: TemplateStats;
}) {
  const t = getDictionary(locale).rfq;
  const fill: Fill = (text) => fillTemplateCounts(text, stats);
  return (
    <div className={`relative min-h-screen bg-background text-foreground ${fonts.body}`}>
      <Backdrop />
      <div className="relative">
        <SiteNav fonts={fonts} locale={locale} />
        <main>
          <Hero fonts={fonts} locale={locale} t={t} />
          <Problem fonts={fonts} t={t} />
          <Build fonts={fonts} t={t} />
          <Measurement fonts={fonts} t={t} />
          <Templates fonts={fonts} locale={locale} t={t} fill={fill} />
          <GuideLink fonts={fonts} locale={locale} t={t} />
          <FinalCta fonts={fonts} locale={locale} t={t} />
        </main>
        <SiteFooter fonts={fonts} locale={locale} />
      </div>
    </div>
  );
}
