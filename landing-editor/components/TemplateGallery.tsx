"use client";
// landing-editor/components/TemplateGallery.tsx
// 模板选择页：行业/范式/转化 三维筛选 + 名称搜索（纯前端，过滤静态 TEMPLATES）。
// UI 取齐官网（components/marketing）：细网格 + 光感背景、玻璃卡片、Syne 渐变标题、
// mono kicker、aqua/tech 主色、motion/react 入场。复用 lib/theme.ts 成套工具类。
import { useMemo, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Search, SlidersHorizontal, Sparkles } from "lucide-react";
import { glassCard, gradientText, gridBackdrop, glowAura, pill } from "@/lib/theme";
import { TEMPLATES } from "../samples/registry";
import { facetOptions, filterTemplates, type TemplateFilters } from "../samples/templateFilter";
import { TemplateGalleryCard } from "./TemplateGalleryCard";

const monoCls = "font-[family-name:var(--font-mono-app)]";

const selectCls =
  "rounded-xl border border-border bg-white/80 px-3.5 py-2.5 text-sm text-foreground shadow-sm backdrop-blur transition-colors focus:border-aqua-300 focus:outline-none focus:ring-2 focus:ring-aqua-400/30";

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0 },
};

function Backdrop() {
  const reduce = useReducedMotion();
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className={gridBackdrop} />
      <motion.div
        aria-hidden
        className={`absolute -top-44 left-1/2 h-[420px] w-[720px] -translate-x-1/2 ${glowAura("aqua-400")}`}
        animate={reduce ? undefined : { opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className={`absolute top-40 -right-36 h-[360px] w-[360px] ${glowAura("glow-2")}`}
        animate={reduce ? undefined : { x: [0, -36, 0], y: [0, 30, 0] }}
        transition={{ duration: 17, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

export function TemplateGallery() {
  const [filters, setFilters] = useState<TemplateFilters>({});
  const opts = useMemo(() => facetOptions(TEMPLATES), []);
  const list = useMemo(() => filterTemplates(TEMPLATES, filters), [filters]);
  const set = (patch: Partial<TemplateFilters>) => setFilters((f) => ({ ...f, ...patch }));
  const active = filters.category || filters.archetype || filters.conversion || filters.query;

  return (
    <main className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <Backdrop />

      <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-24">
        {/* 标题区 */}
        <motion.header
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="mx-auto max-w-2xl text-center"
        >
          <motion.div variants={fadeUp} transition={{ duration: 0.55, ease: "easeOut" }}>
            <span className={`${pill} uppercase tracking-[0.18em] ${monoCls}`}>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-aqua-500" />
              落地页编辑器
            </span>
          </motion.div>

          <motion.h1
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mt-6 text-4xl font-bold leading-[1.14] tracking-tight text-foreground sm:text-5xl"
          >
            挑一套模板，
            <br className="hidden sm:block" />
            <span className={gradientText}>几分钟搭出投放级落地页</span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.55, ease: "easeOut" }}
            className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-muted-foreground"
          >
            选最贴近你业务的行业模板，进入编辑器后可自由调整、增删与排序每个模块——
            结构与文案都已为海外获客调校好，开箱即用。
          </motion.p>
        </motion.header>

        {/* 筛选区 */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.32, ease: "easeOut" }}
          className={`mt-12 flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center ${glassCard}`}
        >
          <span className={`hidden items-center gap-2 text-xs uppercase tracking-[0.18em] text-aqua-600 sm:inline-flex ${monoCls}`}>
            <SlidersHorizontal className="h-3.5 w-3.5" />
            筛选
          </span>
          <select className={selectCls} value={filters.category ?? ""} onChange={(e) => set({ category: e.target.value || undefined })}>
            <option value="">全部行业</option>
            {opts.category.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectCls} value={filters.archetype ?? ""} onChange={(e) => set({ archetype: e.target.value || undefined })}>
            <option value="">全部范式</option>
            {opts.archetype.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select className={selectCls} value={filters.conversion ?? ""} onChange={(e) => set({ conversion: e.target.value || undefined })}>
            <option value="">全部转化方式</option>
            {opts.conversion.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              className={`${selectCls} w-full pl-9 sm:w-60`}
              placeholder="搜索模板名称…"
              value={filters.query ?? ""}
              onChange={(e) => set({ query: e.target.value || undefined })}
            />
          </div>
        </motion.div>

        {/* 结果计数 */}
        <div className={`mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground ${monoCls}`}>
          <span className="h-1 w-1 rounded-full bg-aqua-400" />
          共 {list.length} 套模板
          {active && (
            <button
              type="button"
              onClick={() => setFilters({})}
              className="text-aqua-600 underline-offset-2 transition-colors hover:text-aqua-700 hover:underline"
            >
              · 清空筛选
            </button>
          )}
        </div>

        {/* 卡片网格 / 空态 */}
        {list.length === 0 ? (
          <div className={`mx-auto mt-10 max-w-md px-8 py-16 text-center ${glassCard}`}>
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl border border-aqua-100 bg-aqua-50 text-aqua-600">
              <Sparkles className="h-5 w-5" />
            </span>
            <p className="mt-5 text-sm text-muted-foreground">没有匹配的模板，换个筛选条件试试。</p>
            <button
              type="button"
              onClick={() => setFilters({})}
              className="mt-5 rounded-xl border border-border bg-white/70 px-4 py-2 text-sm font-medium text-foreground/80 backdrop-blur transition-colors hover:border-aqua-300 hover:text-aqua-700"
            >
              清空筛选
            </button>
          </div>
        ) : (
          <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((t, i) => (
              <motion.li
                key={t.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: (i % 3) * 0.08, ease: "easeOut" }}
              >
                <TemplateGalleryCard template={t} />
              </motion.li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
