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
  Languages,
  MousePointerClick,
  BarChart3,
  Sparkles,
  Check,
  ArrowRight,
  Lock,
} from "lucide-react";
import { Routes } from "@/lib/constants";
import { PLANS, PLAN_ORDER } from "@/lib/plans";

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
  "Snapchat",
  "Pinterest Tag",
  "Microsoft UET",
];

const STEPS = [
  {
    icon: LayoutTemplate,
    no: "01",
    title: "选一套爆款模板",
    desc: "从 15+ 行业高转化模板里挑一套，结构、文案、视觉都已为投放调校好，开箱即用。",
  },
  {
    icon: Pencil,
    no: "02",
    title: "可视化改内容",
    desc: "点哪改哪，文案与图片实时预览、自动保存——所见即所得，不写一行代码。",
  },
  {
    icon: Globe,
    no: "03",
    title: "发布到自有域名",
    desc: "绑定你的品牌域名，一键上线。独立域名更利于投放过审与 SEO 收录。",
  },
];

const FEATURES = [
  {
    icon: LayoutTemplate,
    title: "爆款行业模板库",
    desc: "15+ 套为海外获客打磨的高转化模板，覆盖咨询、预约、留资等主流场景，持续上新。",
    glow: "from-cyan-400/20",
  },
  {
    icon: Pencil,
    title: "可视化实时编辑",
    desc: "拖拽式区块编辑，改文案、换图片即时呈现，自动保存草稿，桌面与移动端双视图预览。",
    glow: "from-sky-400/20",
  },
  {
    icon: Globe,
    title: "自有品牌域名发布",
    desc: "一键发布到你自己的域名，独立品牌形象，规避平台限流，对投放审核与自然搜索更友好。",
    glow: "from-indigo-400/20",
  },
  {
    icon: Radar,
    title: "全矩阵像素 + 转化回传",
    desc: "Meta / TikTok / Google 像素同页并行，内建 Meta CAPI 服务端转化与 UTM 全链路归因。",
    glow: "from-violet-400/20",
  },
  {
    icon: ShieldCheck,
    title: "反同质化风控引擎",
    desc: "智能打散页面指纹，规避投放平台查重与封号风险，让你的广告账户跑得更稳更久。",
    glow: "from-emerald-400/20",
  },
  {
    icon: Languages,
    title: "AI 多语言翻译",
    desc: "一键生成多语言版本，快速覆盖更多市场，让一张模板触达全球客户。",
    glow: "from-amber-400/20",
  },
];

const FUNNEL = [
  { icon: Lock, label: "同意管理 (CMP)", note: "按地区合规门控加载" },
  { icon: Radar, label: "像素同步触发", note: "Meta / TikTok / GA4" },
  { icon: MousePointerClick, label: "CTA 行为采集", note: "点击 / 留资事件委托" },
  { icon: BarChart3, label: "转化回传 + 看板", note: "CAPI 服务端 + 数据分析" },
];

/* ------------------------------------------------------------------ *
 * 装饰背景
 * ------------------------------------------------------------------ */

function Backdrop() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* 网格 */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(148,163,184,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.06)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_75%)]" />
      {/* 极光辉光 */}
      <motion.div
        aria-hidden
        className="absolute -top-40 left-1/2 h-[520px] w-[820px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.22),transparent_60%)] blur-3xl"
        animate={reduce ? undefined : { opacity: [0.55, 0.9, 0.55], scale: [1, 1.08, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-24 -left-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.22),transparent_60%)] blur-3xl"
        animate={reduce ? undefined : { x: [0, 60, 0], y: [0, 30, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute top-40 -right-32 h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle_at_center,rgba(168,85,247,0.18),transparent_60%)] blur-3xl"
        animate={reduce ? undefined : { x: [0, -50, 0], y: [0, 40, 0] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
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
          ? "border-b border-white/10 bg-[#05060a]/80 backdrop-blur-xl"
          : "border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href={Routes.Home} className="group flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-cyan-400 to-indigo-500 shadow-[0_0_24px_-4px_rgba(34,211,238,0.7)]">
            <Zap className="h-4 w-4 text-[#05060a]" strokeWidth={2.6} />
          </span>
          <span className={`text-base font-bold tracking-tight text-white ${fonts.display}`}>
            Zap Bridge
          </span>
        </Link>
        <nav className="flex items-center gap-1 text-sm sm:gap-2">
          <Link
            href={Routes.Pricing}
            className="rounded-lg px-3 py-2 text-slate-300 transition-colors hover:text-white"
          >
            套餐定价
          </Link>
          <Link
            href={Routes.Login}
            className="rounded-lg px-3 py-2 text-slate-300 transition-colors hover:text-white"
          >
            登录
          </Link>
          <Link
            href={Routes.Register}
            className="rounded-xl bg-white px-4 py-2 font-medium text-[#05060a] shadow-[0_0_24px_-6px_rgba(255,255,255,0.5)] transition-transform hover:scale-[1.03]"
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
          <span
            className={`inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs uppercase tracking-[0.18em] text-cyan-200 backdrop-blur ${fonts.mono}`}
          >
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
            海外获客落地页引擎
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-7 text-4xl font-extrabold leading-[1.08] tracking-tight text-white sm:text-6xl ${fonts.display}`}
        >
          投放级落地页
          <br className="hidden sm:block" />
          <span className="bg-gradient-to-r from-cyan-300 via-sky-200 to-indigo-300 bg-clip-text text-transparent">
            几分钟上线，跑在你的域名
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
        >
          为做海外获客的创业者与小团队打造的智能落地页引擎：选模板 → 改文案 → 一键发布，
          页面跑在你的品牌域名上，内建全矩阵像素与转化追踪——让每一分广告预算都被看见。
        </motion.p>

        <motion.div
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row"
        >
          <Link
            href={Routes.Register}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-7 py-3.5 font-semibold text-[#05060a] shadow-[0_0_44px_-8px_rgba(34,211,238,0.75)] transition-transform hover:scale-[1.03]"
          >
            免费开始
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={Routes.Pricing}
            className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-7 py-3.5 font-medium text-slate-200 backdrop-blur transition-colors hover:border-white/30 hover:text-white"
          >
            查看套餐
          </Link>
        </motion.div>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-5 text-xs tracking-wide text-slate-500 ${fonts.mono}`}
        >
          免费起步 · 无需信用卡 · 无需写一行代码
        </motion.p>
      </motion.div>

      <EditorMock fonts={fonts} />
    </section>
  );
}

/* 悬浮的“编辑器实景”玻璃卡片 */
function EditorMock({ fonts }: { fonts: Fonts }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      initial={{ opacity: 0, y: 60, rotateX: 12 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
      className="mx-auto mt-16 max-w-4xl [perspective:1200px]"
    >
      <div className="relative rounded-2xl bg-gradient-to-b from-white/15 to-white/5 p-px shadow-[0_40px_120px_-30px_rgba(34,211,238,0.45)]">
        <div className="overflow-hidden rounded-2xl bg-[#0a0c12]">
          {/* 浏览器 chrome */}
          <div className="flex items-center gap-3 border-b border-white/10 bg-white/5 px-4 py-3">
            <div className="flex gap-1.5">
              <span className="h-3 w-3 rounded-full bg-rose-400/80" />
              <span className="h-3 w-3 rounded-full bg-amber-400/80" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/80" />
            </div>
            <div
              className={`mx-auto flex items-center gap-2 rounded-md bg-black/40 px-3 py-1 text-xs text-slate-400 ${fonts.mono}`}
            >
              <Lock className="h-3 w-3 text-emerald-400" />
              yourbrand.com
            </div>
          </div>
          {/* 模拟落地页 */}
          <div className="grid gap-6 p-8 sm:grid-cols-5 sm:p-10">
            <div className="sm:col-span-3">
              <div className="h-2.5 w-24 rounded-full bg-cyan-400/70" />
              <div className="mt-4 h-7 w-4/5 rounded-lg bg-white/80" />
              <div className="mt-2 h-7 w-3/5 rounded-lg bg-gradient-to-r from-cyan-300/80 to-indigo-300/70" />
              <div className="mt-5 space-y-2">
                <div className="h-2.5 w-full rounded-full bg-white/15" />
                <div className="h-2.5 w-11/12 rounded-full bg-white/15" />
                <div className="h-2.5 w-3/4 rounded-full bg-white/15" />
              </div>
              <div className="mt-6 flex gap-3">
                <div className="h-9 w-32 rounded-lg bg-gradient-to-r from-cyan-400 to-indigo-500" />
                <div className="h-9 w-24 rounded-lg border border-white/15" />
              </div>
            </div>
            {/* 留资表单卡 */}
            <div className="rounded-xl border border-white/10 bg-white/5 p-4 sm:col-span-2">
              <div className="h-2.5 w-20 rounded-full bg-white/40" />
              <div className="mt-4 space-y-2.5">
                <div className="h-8 rounded-md bg-black/30" />
                <div className="h-8 rounded-md bg-black/30" />
                <div className="h-8 rounded-md bg-black/30" />
                <div className="h-9 rounded-md bg-gradient-to-r from-cyan-400 to-indigo-500" />
              </div>
            </div>
          </div>
        </div>

        {/* 浮动追踪徽标 */}
        <motion.div
          className={`absolute -right-4 top-20 hidden items-center gap-2 rounded-xl border border-white/15 bg-[#0a0c12]/90 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur sm:flex ${fonts.mono}`}
          animate={reduce ? undefined : { y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        >
          <Radar className="h-4 w-4 text-cyan-400" />
          Meta Pixel · 已触发
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        </motion.div>
        <motion.div
          className={`absolute -left-4 bottom-16 hidden items-center gap-2 rounded-xl border border-white/15 bg-[#0a0c12]/90 px-3 py-2 text-xs text-slate-200 shadow-xl backdrop-blur sm:flex ${fonts.mono}`}
          animate={reduce ? undefined : { y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        >
          <MousePointerClick className="h-4 w-4 text-indigo-300" />
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
    <section className="relative border-y border-white/10 py-10">
      <p className={`mb-6 text-center text-xs uppercase tracking-[0.22em] text-slate-500 ${fonts.mono}`}>
        与你的投放与分析栈无缝对接
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
              className={`flex items-center gap-2 whitespace-nowrap rounded-full border border-white/10 bg-white/5 px-5 py-2 text-sm text-slate-300 ${fonts.mono}`}
            >
              <Radar className="h-3.5 w-3.5 text-cyan-400/80" />
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
      <span className={`text-xs uppercase tracking-[0.22em] text-cyan-300 ${fonts.mono}`}>{kicker}</span>
      <h2 className={`mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl ${fonts.display}`}>
        {title}
      </h2>
      <p className="mt-4 text-base leading-relaxed text-slate-400">{desc}</p>
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
        title="从想法到上线，不超过一杯咖啡的时间"
        desc="没有繁琐的搭建流程，没有等待开发排期。你只需要专注于打动客户的内容。"
        fonts={fonts}
      />
      <div className="relative mx-auto mt-16 max-w-5xl">
        {/* 连接光束 */}
        <div className="absolute left-0 right-0 top-10 hidden h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent md:block" />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {STEPS.map(({ icon: Icon, no, title, desc }, i) => (
            <motion.div
              key={no}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.55, delay: i * 0.12, ease: "easeOut" }}
              className="relative rounded-2xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur"
            >
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-xl border border-white/10 bg-gradient-to-br from-cyan-400/20 to-indigo-500/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </span>
                <span className={`text-3xl font-bold text-white/10 ${fonts.display}`}>{no}</span>
              </div>
              <h3 className={`mt-5 text-lg font-semibold text-white ${fonts.display}`}>{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
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
        title="一套引擎，包办从制作到归因的每一步"
        desc="不只是把页面做得好看——更要让它能投、能跑、能被精准衡量。"
        fonts={fonts}
      />
      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map(({ icon: Icon, title, desc, glow }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: (i % 3) * 0.1, ease: "easeOut" }}
            className="group relative rounded-2xl bg-gradient-to-b from-white/10 to-white/[0.02] p-px transition-transform hover:-translate-y-1"
          >
            <div className="relative h-full overflow-hidden rounded-2xl bg-[#0a0c12] p-6">
              <div
                className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br ${glow} to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100`}
              />
              <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-cyan-300">
                <Icon className="h-5 w-5" />
              </span>
              <h3 className={`mt-5 text-lg font-semibold text-white ${fonts.display}`}>{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{desc}</p>
            </div>
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
      <div className="mx-auto max-w-6xl rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-8 sm:p-12">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <span className={`text-xs uppercase tracking-[0.22em] text-cyan-300 ${fonts.mono}`}>
              {"// 数据归因闭环"}
            </span>
            <h2 className={`mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl ${fonts.display}`}>
              每一次点击，都能回到你的广告后台
            </h2>
            <p className="mt-4 text-base leading-relaxed text-slate-400">
              从用户授权、像素触发、行为采集到服务端转化回传，全链路自动打通。配合平台数据分析面板，
              真正知道哪条广告、哪个素材、哪张落地页在赚钱。
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "多平台像素同页并行，零冲突触发",
                "Meta CAPI 服务端转化，绕过浏览器拦截更准",
                "UTM 全链路归因，定位高 ROI 渠道",
                "内建同意管理 (CMP)，合规与转化兼得",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3 text-sm text-slate-300">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
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
                className="flex items-center gap-4 rounded-xl border border-white/10 bg-white/[0.03] px-5 py-4 backdrop-blur"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-cyan-400/20 to-indigo-500/10 text-cyan-300">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className={`text-xs text-slate-400 ${fonts.mono}`}>{note}</p>
                </div>
                {i < FUNNEL.length - 1 && (
                  <ArrowRight className="ml-auto h-4 w-4 rotate-90 text-slate-600" />
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
 * 定价（暗色，复用 PLANS 单一数据源）
 * ------------------------------------------------------------------ */

function Pricing({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 py-24">
      <SectionHead
        kicker="// 简单透明的定价"
        title="先免费起步，跑出 ROI 再升级"
        desc="按落地页数量与追踪能力分级，随业务增长平滑升级，随时可退。"
        fonts={fonts}
      />
      <div className="mx-auto mt-16 grid max-w-6xl grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PLAN_ORDER.map((planId, i) => {
          const plan = PLANS[planId];
          const isFree = planId === "free";
          const price = plan.priceText === "$0" ? "免费" : plan.priceText.split("/")[0];
          return (
            <motion.div
              key={planId}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
              className={`relative rounded-2xl p-px ${
                plan.highlight
                  ? "bg-gradient-to-b from-cyan-400/60 to-indigo-500/40 shadow-[0_0_60px_-15px_rgba(34,211,238,0.6)]"
                  : "bg-gradient-to-b from-white/10 to-white/[0.02]"
              }`}
            >
              <div className="flex h-full flex-col rounded-2xl bg-[#0a0c12] p-6">
                {plan.highlight && (
                  <span
                    className={`mb-3 self-start rounded-full bg-gradient-to-r from-cyan-400 to-indigo-500 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#05060a] ${fonts.mono}`}
                  >
                    最受欢迎
                  </span>
                )}
                <p className={`text-xs uppercase tracking-[0.18em] text-slate-400 ${fonts.mono}`}>
                  {plan.label}
                </p>
                <p className={`mt-2 text-4xl font-bold text-white ${fonts.display}`}>
                  {price}
                  {!isFree && <span className="text-base font-normal text-slate-500">/月</span>}
                </p>
                <Link
                  href={isFree ? Routes.Register : Routes.Pricing}
                  className={`mt-5 rounded-xl py-2.5 text-center text-sm font-semibold transition-transform hover:scale-[1.02] ${
                    plan.highlight
                      ? "bg-gradient-to-r from-cyan-400 to-indigo-500 text-[#05060a] shadow-[0_0_30px_-8px_rgba(34,211,238,0.7)]"
                      : "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                  }`}
                >
                  {isFree ? "免费开始" : "选择此套餐"}
                </Link>
                <ul className="mt-6 space-y-2.5 border-t border-white/10 pt-5">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                      {h}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-10 text-center">
        <Link
          href={Routes.Pricing}
          className="inline-flex items-center gap-1.5 text-sm text-cyan-300 transition-colors hover:text-cyan-200"
        >
          查看完整功能对比
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
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
        className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-transparent px-8 py-16 text-center"
      >
        <div className="pointer-events-none absolute left-1/2 top-0 h-64 w-96 -translate-x-1/2 rounded-full bg-[radial-gradient(circle_at_center,rgba(34,211,238,0.25),transparent_60%)] blur-3xl" />
        <Sparkles className="mx-auto h-8 w-8 text-cyan-300" />
        <h2 className={`mt-5 text-3xl font-bold tracking-tight text-white sm:text-5xl ${fonts.display}`}>
          把下一次投放，押在<br className="hidden sm:block" />
          一张真正会转化的落地页上
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-base text-slate-400">
          现在免费创建你的第一张落地页，几分钟后就能跑在你自己的品牌域名上。
        </p>
        <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={Routes.Register}
            className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-indigo-500 px-8 py-3.5 font-semibold text-[#05060a] shadow-[0_0_44px_-8px_rgba(34,211,238,0.75)] transition-transform hover:scale-[1.03]"
          >
            免费开始
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href={Routes.Login}
            className="rounded-xl border border-white/15 bg-white/5 px-8 py-3.5 font-medium text-slate-200 transition-colors hover:text-white"
          >
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
    <footer className="border-t border-white/10 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 text-sm text-slate-500 md:flex-row">
        <div className="flex items-center gap-2">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-cyan-400 to-indigo-500">
            <Zap className="h-3 w-3 text-[#05060a]" strokeWidth={2.6} />
          </span>
          <span className={`font-semibold text-slate-300 ${fonts.display}`}>Zap Bridge</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
        <nav className="flex items-center gap-5">
          <Link href={Routes.Pricing} className="transition-colors hover:text-white">
            套餐定价
          </Link>
          <Link href={Routes.Login} className="transition-colors hover:text-white">
            登录
          </Link>
          <Link href={Routes.Register} className="transition-colors hover:text-white">
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
    <div className={`relative min-h-screen bg-[#05060a] text-slate-300 ${fonts.body}`}>
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
