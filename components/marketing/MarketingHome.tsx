"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import {
  Zap,
  LayoutTemplate,
  Pencil,
  Globe,
  Radar,
  ShieldCheck,
  MousePointerClick,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Routes } from "@/lib/constants";
import { PlanComparison } from "@/components/billing/PlanComparison";
import { ctaPrimary, ctaGhost, gradientText, glassCard, pill, glowAura } from "@/lib/theme";

type Fonts = { display: string; body: string; mono: string };

/* ------------------------------------------------------------------ *
 * 数据
 * ------------------------------------------------------------------ */

const PLATFORMS = [
  "Meta Pixel",
  "Meta CAPI",
  "Google Ads",
  "Google Analytics 4",
  "TikTok Pixel",
  "TikTok Events API",
];

const STEPS = [
  {
    icon: LayoutTemplate,
    no: "01",
    title: "选一套获客模板",
    desc: "从 30+ 海外获客模板中选择适合的行业与咨询场景，快速搭好页面结构和内容起点。",
  },
  {
    icon: Pencil,
    no: "02",
    title: "可视化编辑内容",
    desc: "选择区块后修改文案与图片，支持区块拖拽排序、自动保存，以及移动端和桌面端实时预览。",
  },
  {
    icon: Globe,
    no: "03",
    title: "升级后发布到自有域名",
    desc: "准备投放时升级套餐，绑定并完成品牌域名的 DNS 验证，即可发布页面并配置 SEO 信息。",
  },
];

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: "海外获客模板库",
    desc: "30+ 套咨询与留资模板，覆盖美妆、服饰、家居、数码、本地服务等行业，可直接作为编辑起点。",
  },
  {
    icon: Pencil,
    title: "可视化内容编辑",
    desc: "通过区块表单修改文案与图片，拖拽调整区块顺序，自动保存草稿，并实时切换桌面与移动端预览。",
  },
  {
    icon: Globe,
    title: "自有品牌域名发布",
    desc: "付费套餐可绑定自有品牌域名；完成 DNS 验证后发布页面，并支持独立 SEO 标题、描述与分享图。",
  },
  {
    icon: Radar,
    title: "多平台追踪 + 转化回传",
    desc: "按套餐配置 Meta、TikTok、GA4 与 Google Ads；Pro 及以上支持 Meta / TikTok 服务端转化回传和 UTM 来源记录。",
  },
  {
    icon: ShieldCheck,
    title: "页面结构变体",
    desc: "Agency 套餐可更换页面变体种子，在内容一致的前提下调整 Hero 布局、包裹结构与 meta 标识，降低同模板页面完全一致的概率。",
  },
  {
    icon: Sparkles,
    title: "AI 一键生成 & 智能改写",
    desc: "输入业务资料后，AI 可按当前模板生成整页营销文案和图库配图，也可逐段改写；发布前仍需核对事实、案例与素材。",
  },
];

const FUNNEL = [
  { icon: Lock, label: "Cookie 同意门控", note: "可选开启，同意后加载第三方像素" },
  { icon: Radar, label: "多平台像素", note: "Meta / TikTok / GA4 / Google Ads" },
  { icon: MousePointerClick, label: "获客行为采集", note: "CTA 点击 + 表单提交" },
  { icon: BarChart3, label: "转化回传 + 基础看板", note: "Meta / TikTok CAPI + PV / CTA / UTM 来源" },
];

/* ------------------------------------------------------------------ *
 * 装饰背景（克制光感 + 细网格）
 * ------------------------------------------------------------------ */

function Backdrop() {
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

function SiteNav({ fonts }: { fonts: Fonts }) {
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
            href="#pricing"
            className="rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:text-aqua-700"
          >
            套餐定价
          </Link>
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
 * Hero
 * ------------------------------------------------------------------ */

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

function Hero({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 pt-36 pb-20 sm:pt-44">
      <motion.div
        initial="hidden"
        animate="show"
        variants={{ show: { transition: { staggerChildren: 0.12 } } }}
        className="mx-auto max-w-4xl text-center"
      >
        <motion.div variants={fadeUp} transition={{ duration: 0.6, ease: "easeOut" }}>
          <span className={`${pill} uppercase tracking-[0.18em] ${fonts.mono}`}>
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua-500" />
            海外获客落地页引擎
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-7 text-4xl font-bold leading-[1.12] tracking-tight text-foreground sm:text-6xl ${fonts.display}`}
        >
          投放级落地页
          <br className="hidden sm:block" />
          <span className={gradientText}>免费创建与预览，准备投放再发布</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          为做海外获客的创业者与小团队打造：从 30+ 模板开始，编辑内容、AI 生成文案并实时预览；
          准备投放时升级发布到品牌域名，再按套餐配置像素、UTM 与服务端转化回传。
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link href={Routes.Register} className={ctaPrimary}>
            免费开始
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href="#pricing" className={ctaGhost}>
            查看套餐
          </Link>
        </motion.div>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-5 text-xs tracking-wide text-muted-foreground/80 ${fonts.mono}`}
        >
          免费创建与预览 · 无需信用卡 · 无需写一行代码
        </motion.p>
      </motion.div>

      <EditorMock fonts={fonts} />
    </section>
  );
}

/* 悬浮的“编辑器实景”玻璃卡片（明亮净白） */
function EditorMock({ fonts }: { fonts: Fonts }) {
  const reduce = useReducedMotion();
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
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Radar className="h-4 w-4 text-aqua-500" />
          Meta Pixel · 已触发
          <Check className="h-3.5 w-3.5 text-emerald-500" />
        </motion.div>
        <motion.div
          className={`absolute -left-4 bottom-16 hidden items-center gap-2 rounded-xl border border-border bg-white/95 px-3 py-2 text-xs text-foreground shadow-lg backdrop-blur sm:flex ${fonts.mono}`}
          animate={reduce ? undefined : { y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <MousePointerClick className="h-4 w-4 text-tech" />
          Lead 转化 +1
        </motion.div>
      </div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * 平台跑马灯
 * ------------------------------------------------------------------ */

function LogoMarquee({ fonts }: { fonts: Fonts }) {
  const reduce = useReducedMotion();
  const items = [...PLATFORMS, ...PLATFORMS];
  return (
    <section className="relative border-y border-border py-10">
      <p className={`mb-6 text-center text-xs uppercase tracking-[0.22em] text-muted-foreground ${fonts.mono}`}>
        支持接入这些投放与分析工具
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <motion.div
          className="flex w-max gap-4"
          animate={reduce ? undefined : { x: ["0%", "-50%"] }}
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
 * 区块标题
 * ------------------------------------------------------------------ */

function SectionHead({
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
 * 三步流程
 * ------------------------------------------------------------------ */

function Steps({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 py-24">
      <SectionHead
        kicker="// 三步上线"
        title="先免费完成页面，准备投放时再发布"
        desc="创建、编辑与预览无需付费；需要公开投放时，升级套餐并完成自有域名验证即可发布。"
        fonts={fonts}
      />
      <div className="relative mx-auto mt-16 max-w-5xl">
        {/* 连接光束 */}
        <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-aqua-300 to-transparent md:block" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, no, title, desc }, i) => (
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
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 功能网格
 * ------------------------------------------------------------------ */

function Features({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 py-24">
      <SectionHead
        kicker="// 为转化而生"
        title="从页面制作，到发布与获客数据采集"
        desc="先把咨询与留资页面做好，再按投放需要启用自有域名、像素、UTM 和服务端回传。"
        fonts={fonts}
      />
      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
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
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 数据归因闭环
 * ------------------------------------------------------------------ */

function TrackingShowcase({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 py-24">
      <div className={`mx-auto max-w-6xl p-8 sm:p-12 ${glassCard}`}>
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className={`text-xs uppercase tracking-[0.22em] text-aqua-600 ${fonts.mono}`}>
              {"// 获客数据追踪"}
            </span>
            <h2 className={`mt-3 text-3xl font-bold tracking-tight text-foreground sm:text-4xl ${fonts.display}`}>
              CTA 与来源数据，集中回到你的看板
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              配置追踪后，第三方像素可上报页面访问与 CTA 行为；平台看板同时汇总 PV、CTA 点击、
              渠道与 UTM 来源。Pro 及以上还可配置 Meta / TikTok 服务端转化回传。
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "Pro 及以上支持 Meta、TikTok、GA4 与 Google Ads",
                "Meta / TikTok 服务端转化回传，与表单事件配合去重",
                "记录 UTM 来源并按落地页查看基础访问与 CTA 数据",
                "可选 Cookie 同意条，同意后再加载第三方像素",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-foreground/80">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-aqua-600" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* 漏斗流程 */}
          <div className="space-y-3">
            {FUNNEL.map(({ icon: Icon, label, note }, i) => (
              <motion.div
                key={label}
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
                {i < FUNNEL.length - 1 && (
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

function Pricing({ fonts }: { fonts: Fonts }) {
  return (
    <section id="pricing" className="relative scroll-mt-24 px-6 py-24">
      <SectionHead
        kicker="// 简单透明的定价"
        title="先免费完成第一版，准备投放时再升级"
        desc="Free 可创建、保存和在线预览；升级后绑定自有域名，并按套餐解锁更多页面、追踪与 AI 额度。"
        fonts={fonts}
      />
      <div className="mx-auto mt-16 max-w-6xl">
        <PlanComparison
          ctaFor={(planId) =>
            planId === "free"
              ? { href: Routes.Register, label: "免费开始" }
              : { href: Routes.Register, label: "注册后升级" }
          }
        />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 结尾 CTA
 * ------------------------------------------------------------------ */

function FinalCTA({ fonts }: { fonts: Fonts }) {
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
          先免费做好第一版<br className="hidden sm:block" />
          海外获客落地页
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-base text-muted-foreground">
          无需信用卡即可创建、编辑并预览；准备投放时再升级，绑定自己的品牌域名发布。
        </p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={Routes.Register} className={ctaPrimary}>
            免费开始
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href={Routes.Login} className={ctaGhost}>
            已有账号，登录
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 页脚
 * ------------------------------------------------------------------ */

function SiteFooter({ fonts }: { fonts: Fonts }) {
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
          <Link href="#pricing" className="transition-colors hover:text-aqua-700">
            套餐定价
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

/* ------------------------------------------------------------------ *
 * 页面装配
 * ------------------------------------------------------------------ */

export default function MarketingHome({ fonts }: { fonts: Fonts }) {
  return (
    <div className={`relative min-h-screen bg-background text-foreground ${fonts.body}`}>
      <Backdrop />
      <div className="relative">
        <SiteNav fonts={fonts} />
        <main>
          <Hero fonts={fonts} />
          <LogoMarquee fonts={fonts} />
          <Steps fonts={fonts} />
          <Features fonts={fonts} />
          <TrackingShowcase fonts={fonts} />
          <Pricing fonts={fonts} />
          <FinalCTA fonts={fonts} />
        </main>
        <SiteFooter fonts={fonts} />
      </div>
    </div>
  );
}
