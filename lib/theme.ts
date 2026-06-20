/**
 * 玫瑰智核 · 全局 UI 风格预设
 * ------------------------------------------------------------------
 * 把「粉色科技感」里反复出现的成套 Tailwind 工具类集中在此，
 * 组件统一 import 引用，改一处即可全局生效（配合 styles/theme.css 的 token）。
 *
 * 仅放纯 Tailwind 工具类字符串——不写自定义 CSS、不写内联样式。
 * 颜色一律走 token：bloom-*（玫瑰粉阶）/ tech（电光紫）/ glow-*（光晕）/ 语义色。
 */

/** 品牌渐变文字（标题高亮用） */
export const gradientText =
  "bg-gradient-to-r from-bloom-600 via-bloom-500 to-tech bg-clip-text text-transparent";

/** 主 CTA：实心粉→紫渐变按钮 */
export const ctaPrimary =
  "group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-bloom-500 to-tech px-7 py-3.5 font-semibold text-white shadow-lg shadow-bloom-500/30 transition-transform hover:scale-[1.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bloom-400 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

/** 次级 CTA：玻璃描边按钮 */
export const ctaGhost =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-bloom-200 bg-white/70 px-7 py-3.5 font-medium text-bloom-700 backdrop-blur transition-colors hover:border-bloom-400 hover:bg-white";

/** 玻璃拟态卡片表面 */
export const glassCard =
  "rounded-2xl border border-bloom-100 bg-white/70 shadow-[0_24px_70px_-40px_rgba(240,61,131,0.5)] backdrop-blur-xl";

/** 玻璃面板（更轻，用于浮层/导航） */
export const glassPanel =
  "border border-bloom-100/80 bg-white/75 backdrop-blur-xl";

/** 图标徽章（粉底圆角方块） */
export const iconBadge =
  "grid place-items-center rounded-xl border border-bloom-100 bg-bloom-50 text-bloom-600";

/** 标签胶囊（kicker / 状态） */
export const pill =
  "inline-flex items-center gap-2 rounded-full border border-bloom-200 bg-bloom-50/80 px-4 py-1.5 text-xs font-medium text-bloom-700 backdrop-blur";

/**
 * 细网格背景纹理（科技感）。放在装饰层 div 上；用顶部径向遮罩柔化。
 * 颜色走 bloom-500 的低透明度，避免硬编码色值（arbitrary value 里空格须用下划线）。
 */
export const gridBackdrop =
  "absolute inset-0 bg-[linear-gradient(to_right,color-mix(in_oklab,var(--color-bloom-500)_8%,transparent)_1px,transparent_1px),linear-gradient(to_bottom,color-mix(in_oklab,var(--color-bloom-500)_8%,transparent)_1px,transparent_1px)] bg-[size:56px_56px] [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,black,transparent_75%)]";

/**
 * 径向光晕（配 motion 用）。用字面量查表，确保 Tailwind 能静态提取这些 arbitrary value。
 */
const GLOW_AURA = {
  "bloom-500":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-bloom-500)_55%,transparent),transparent_60%)] blur-3xl",
  tech: "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-tech)_55%,transparent),transparent_60%)] blur-3xl",
  "glow-pink":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-glow-pink)_55%,transparent),transparent_60%)] blur-3xl",
  "glow-violet":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-glow-violet)_55%,transparent),transparent_60%)] blur-3xl",
  "glow-rose":
    "rounded-full bg-[radial-gradient(circle_at_center,color-mix(in_oklab,var(--color-glow-rose)_55%,transparent),transparent_60%)] blur-3xl",
} as const;

export function glowAura(token: keyof typeof GLOW_AURA) {
  return GLOW_AURA[token];
}
