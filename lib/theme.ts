/**
 * 深青 · 明亮 — 全局 UI 风格预设
 * ------------------------------------------------------------------
 * 把「明亮轻盈青」里反复出现的成套 Tailwind 工具类集中在此，
 * 组件统一 import 引用，改一处即可全局生效（配合 styles/theme.css 的 token）。
 *
 * 仅放纯 Tailwind 工具类字符串——不写自定义 CSS、不写内联样式。
 * 颜色一律走 token：aqua-*（薄荷青阶）/ tech（深青）/ glow-*（光感）/ 语义色。
 * 设计基调：净白底、柔色按钮（轻盈）、唯主 CTA 稍实（保转化）、克制光感。
 */

/** 品牌渐变文字（标题高亮用，深青保证白底可读） */
export const gradientText =
  "bg-gradient-to-r from-aqua-700 via-aqua-600 to-tech bg-clip-text text-transparent";

/** 主 CTA：实心深青渐变按钮（唯一稍重的元素，确保转化力） */
export const ctaPrimary =
  "group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-aqua-600 to-tech px-7 py-3.5 font-semibold text-white shadow-sm shadow-aqua-600/25 transition-all hover:shadow-md hover:shadow-aqua-600/30 hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aqua-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** 柔色按钮：浅青底 + 深青字（轻盈默认款） */
export const ctaSoft =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-aqua-100 px-7 py-3.5 font-semibold text-aqua-700 transition-colors hover:bg-aqua-200";

/** 次级 CTA：描边玻璃按钮 */
export const ctaGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-white/70 px-7 py-3.5 font-medium text-foreground/80 backdrop-blur transition-colors hover:border-aqua-300 hover:text-aqua-700";

/** 玻璃拟态卡片表面（轻盈、近白、细描边、柔投影） */
export const glassCard =
  "rounded-2xl border border-border bg-white/80 shadow-[0_18px_50px_-34px_rgba(15,23,42,.30)] backdrop-blur-xl";

/** 玻璃面板（更轻，用于浮层/导航） */
export const glassPanel =
  "border border-border/80 bg-white/75 backdrop-blur-xl";

/** 图标徽章（浅青圆角方块） */
export const iconBadge =
  "grid place-items-center rounded-xl border border-aqua-100 bg-aqua-50 text-aqua-600";

/** 标签胶囊（kicker / 状态） */
export const pill =
  "inline-flex items-center gap-2 rounded-full border border-aqua-100 bg-aqua-50/80 px-4 py-1.5 text-xs font-medium text-aqua-700 backdrop-blur";

/**
 * 细网格背景纹理（科技感）。放在装饰层 div 上；用顶部径向遮罩柔化。
 * 颜色走 aqua-400 的低透明度（arbitrary value 里空格须用下划线）。
 */
export const gridBackdrop =
  "absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-aqua-400)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-aqua-400)_8%,transparent)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_75%)]";

/**
 * 径向光感（克制使用）。字面量查表，确保 Tailwind 能静态提取这些 arbitrary value。
 */
const GLOW_AURA = {
  "aqua-400":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-aqua-400)_42%,transparent),transparent_62%)] blur-3xl",
  tech: "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-tech)_42%,transparent),transparent_62%)] blur-3xl",
  "glow-1":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-glow-1)_42%,transparent),transparent_62%)] blur-3xl",
  "glow-2":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-glow-2)_40%,transparent),transparent_62%)] blur-3xl",
  "glow-3":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-glow-3)_42%,transparent),transparent_62%)] blur-3xl",
} as const;

export function glowAura(token: keyof typeof GLOW_AURA) {
  return GLOW_AURA[token];
}
