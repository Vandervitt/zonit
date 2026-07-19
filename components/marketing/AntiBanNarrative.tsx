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
import { Backdrop, SiteNav, SiteFooter, SectionHead, fadeUp, type Fonts } from "./chrome";
import { ctaPrimary, ctaGhost, gradientText, glassCard, pill, glowAura } from "@/lib/theme";

/* ------------------------------------------------------------------ *
 * 数据
 * ------------------------------------------------------------------ */

// 广告主的三重恐惧：同模板 → 查重 → 处置。
const FEARS = [
  {
    icon: ScanSearch,
    title: "页面查重拒审",
    desc: "多个广告主套用同一套模板，生成页 HTML 高度雷同。投放平台的相似度检测把它判为低质重复内容，广告直接拒审。",
  },
  {
    icon: TrendingDown,
    title: "限流与降权",
    desc: "即便过审，雷同指纹也会拉低质量分：展示量被压、单次成本抬高，预算烧在被限流的页面上，转化迟迟起不来。",
  },
  {
    icon: Link2,
    title: "账户关联封号",
    desc: "平台把指纹相近的页面视作同一批操作者。一个页面出问题，与它「长得像」的页面和广告账户被连坐关停——这是投手最怕的连环封。",
  },
];

// 引擎的工作机制（与实际实现对齐：种子化确定性 variant）。
const MECHANISMS = [
  {
    icon: Boxes,
    title: "DOM 结构抖动",
    desc: "在区块边界注入语义中性的包裹层，改变 DOM 树形状与序列化哈希——视觉零副作用，字节级查重却失效。",
  },
  {
    icon: Fingerprint,
    title: "属性与 meta 加盐",
    desc: "区块根节点的 data 属性、生成类标识与 head 中非必要 meta 的顺序/存在性按种子变化，打散属性与页头指纹。",
  },
  {
    icon: Layers,
    title: "版式与 Hero 变体",
    desc: "同一种子驱动 Hero 布局、间距节奏与等价 Tailwind 类的离散互换。经过测试的有限变体集合，既打散感知哈希又不破版。",
  },
  {
    icon: RefreshCw,
    title: "确定性、可缓存、可重洗",
    desc: "指纹纯由种子派生：同页每次渲染一致，可缓存、无水合错位。页面被判重时一键换种子，重新打散——你的逃生门。",
  },
];

// 合规边界要点（这不是 cloaking）。
const ETHICS = [
  "对真实访客与审核爬虫展示完全相同的内容，不隐藏、不替换、不伪装任何信息。",
  "只打散不同广告主之间的 markup / 版式指纹，页面文案、报价与素材保持你填写的原样。",
  "仅服务于合法的非交易线索页：让正当广告主不因套用同模板而被误判为彼此的克隆。",
];

/* ------------------------------------------------------------------ *
 * Hero
 * ------------------------------------------------------------------ */

function Hero({ fonts }: { fonts: Fonts }) {
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
            Agency 反同质化风控
          </span>
        </motion.div>

        <motion.h1
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className={`mt-7 text-4xl font-bold leading-[1.14] tracking-tight text-foreground sm:text-6xl ${fonts.display}`}
        >
          同一套模板，十个广告主
          <br className="hidden sm:block" />
          <span className={gradientText}>别让查重把你误伤成克隆</span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground"
        >
          海外获客投手最深的恐惧不是没量，而是页面雷同被平台判重、限流，甚至连坐封号。
          Zap Bridge 的反同质化风控引擎，让每个已发布页拥有独立指纹——内容对所有人一致，指纹却互不相同。
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
          <Link href={`${Routes.Home}#pricing`} className={ctaGhost}>
            查看 Agency 套餐
          </Link>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 恐惧：同模板的连环风险
 * ------------------------------------------------------------------ */

function Fears({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 py-20">
      <SectionHead
        kicker="// 同模板的代价"
        title="被判重的那一刻，麻烦是连环的"
        desc="套用现成模板本是效率，但当无数广告主生成几乎一样的页面，平台的相似度检测会把它们串成一挂。"
        fonts={fonts}
      />
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 md:grid-cols-3">
        {FEARS.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
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

function Mechanisms({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 py-24">
      <SectionHead
        kicker="// 指纹独立化引擎"
        title="内容一模一样，指纹各不相同"
        desc="发布时按页面种子确定性地打散页面指纹；页面被判重或限流时，一键重洗即可换一副全新指纹。"
        fonts={fonts}
      />
      <div className="mx-auto mt-14 grid max-w-5xl grid-cols-1 gap-5 sm:grid-cols-2">
        {MECHANISMS.map(({ icon: Icon, title, desc }, i) => (
          <motion.div
            key={title}
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

function Ethics({ fonts }: { fonts: Fonts }) {
  return (
    <section className="relative px-6 py-20">
      <div className={`mx-auto max-w-4xl p-8 sm:p-12 ${glassCard}`}>
        <span className="grid h-12 w-12 place-items-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600">
          <ShieldCheck className="h-6 w-6" />
        </span>
        <h2 className={`mt-6 text-2xl font-bold tracking-tight text-foreground sm:text-3xl ${fonts.display}`}>
          这不是 cloaking，是给正当广告主的护栏
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          我们不对审核爬虫与真实用户做内容差异化。反同质化只作用在页面的结构指纹层，
          不触碰你要传达给用户的任何一句话。
        </p>
        <ul className="mt-6 space-y-3">
          {ETHICS.map((t) => (
            <li key={t} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/80">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              {t}
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

function AgencyCta({ fonts }: { fonts: Fonts }) {
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
          反同质化，是 Agency 套餐的底气
        </h2>
        <p className="relative mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground">
          批量投放、多广告主、多页面并跑，最怕的就是彼此关联被连坐。反同质化风控引擎为 Agency
          套餐内建：每个已发布页指纹独立，随时可一键重洗，让规模化投放不再自我拖累。
        </p>
        <div className="relative mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href={`${Routes.Home}#pricing`} className={ctaPrimary}>
            了解 Agency 套餐
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link href={Routes.Register} className={ctaGhost}>
            先免费创建页面
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ *
 * 页面装配
 * ------------------------------------------------------------------ */

export default function AntiBanNarrative({ fonts }: { fonts: Fonts }) {
  return (
    <div className={`relative min-h-screen bg-background text-foreground ${fonts.body}`}>
      <Backdrop />
      <div className="relative">
        <SiteNav fonts={fonts} />
        <main>
          <Hero fonts={fonts} />
          <Fears fonts={fonts} />
          <Mechanisms fonts={fonts} />
          <Ethics fonts={fonts} />
          <AgencyCta fonts={fonts} />
        </main>
        <SiteFooter fonts={fonts} />
      </div>
    </div>
  );
}
