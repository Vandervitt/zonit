// landing-renderer/theme.ts
// 渲染器主题：字段值全部是写死的完整 Tailwind class 串。
// 换肤 = 另定义一个同形状对象。严禁运行期拼接类名（Tailwind JIT 扫不到）。
export interface RendererTheme {
  accentGradient: string;       // 实心渐变背景（CTA / 序号 / AFTER 角标 / 倒计时条 / 悬浮按钮）
  accentGradientHover: string;  // CTA hover
  accentShadow: string;         // CTA 投影
  accentTextGradient: string;   // 渐变文字（stats 数字）
  accentText: string;           // 强调文字（链接 / channel / ✓ / +）
  accentSoftBg: string;         // 浅底（badge / plan badge）
  accentSoftBorder: string;     // 浅边（badge）
  accentSoftText: string;       // 浅底上的强调文字
  accentIconBg: string;         // 特性图标渐变底
  glassCard: string;            // 暗色区块上的玻璃卡
}

export const tealEmerald: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-teal-500 to-emerald-600",
  accentGradientHover: "hover:from-teal-600 hover:to-emerald-700",
  accentShadow: "shadow-lg shadow-teal-500/30",
  accentTextGradient: "bg-gradient-to-r from-teal-600 to-emerald-600 bg-clip-text text-transparent",
  accentText: "text-teal-600",
  accentSoftBg: "bg-teal-50",
  accentSoftBorder: "border-teal-200",
  accentSoftText: "text-teal-700",
  accentIconBg: "bg-gradient-to-br from-teal-100 to-emerald-100",
  glassCard: "border border-white/10 bg-white/5",
};

import type { ThemeId } from "@/types/schema.draft";

export const blueIndigo: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-blue-500 to-indigo-600",
  accentGradientHover: "hover:from-blue-600 hover:to-indigo-700",
  accentShadow: "shadow-lg shadow-blue-500/30",
  accentTextGradient: "bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent",
  accentText: "text-blue-600",
  accentSoftBg: "bg-blue-50",
  accentSoftBorder: "border-blue-200",
  accentSoftText: "text-blue-700",
  accentIconBg: "bg-gradient-to-br from-blue-100 to-indigo-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const rosePink: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-rose-500 to-pink-600",
  accentGradientHover: "hover:from-rose-600 hover:to-pink-700",
  accentShadow: "shadow-lg shadow-rose-500/30",
  accentTextGradient: "bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent",
  accentText: "text-rose-600",
  accentSoftBg: "bg-rose-50",
  accentSoftBorder: "border-rose-200",
  accentSoftText: "text-rose-700",
  accentIconBg: "bg-gradient-to-br from-rose-100 to-pink-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const amberOrange: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-amber-500 to-orange-600",
  accentGradientHover: "hover:from-amber-600 hover:to-orange-700",
  accentShadow: "shadow-lg shadow-amber-500/30",
  accentTextGradient: "bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent",
  accentText: "text-amber-600",
  accentSoftBg: "bg-amber-50",
  accentSoftBorder: "border-amber-200",
  accentSoftText: "text-amber-700",
  accentIconBg: "bg-gradient-to-br from-amber-100 to-orange-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const violetPurple: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-violet-500 to-purple-600",
  accentGradientHover: "hover:from-violet-600 hover:to-purple-700",
  accentShadow: "shadow-lg shadow-violet-500/30",
  accentTextGradient: "bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent",
  accentText: "text-violet-600",
  accentSoftBg: "bg-violet-50",
  accentSoftBorder: "border-violet-200",
  accentSoftText: "text-violet-700",
  accentIconBg: "bg-gradient-to-br from-violet-100 to-purple-100",
  glassCard: "border border-white/10 bg-white/5",
};

export const slateNeutral: RendererTheme = {
  accentGradient: "bg-gradient-to-r from-slate-700 to-slate-900",
  accentGradientHover: "hover:from-slate-800 hover:to-black",
  accentShadow: "shadow-lg shadow-slate-700/30",
  accentTextGradient: "bg-gradient-to-r from-slate-700 to-slate-900 bg-clip-text text-transparent",
  accentText: "text-slate-700",
  accentSoftBg: "bg-slate-100",
  accentSoftBorder: "border-slate-300",
  accentSoftText: "text-slate-800",
  accentIconBg: "bg-gradient-to-br from-slate-100 to-slate-200",
  glassCard: "border border-white/10 bg-white/5",
};

export const THEMES: Record<ThemeId, RendererTheme> = {
  teal: tealEmerald,
  blue: blueIndigo,
  rose: rosePink,
  amber: amberOrange,
  violet: violetPurple,
  slate: slateNeutral,
};

/** 编辑器色卡用：swatch 为预览渐变 class（写死，Tailwind JIT 可扫到）。 */
export const THEME_META: { id: ThemeId; label: string; swatch: string }[] = [
  { id: "teal",   label: "青翠", swatch: "bg-gradient-to-r from-teal-500 to-emerald-600" },
  { id: "blue",   label: "蓝",   swatch: "bg-gradient-to-r from-blue-500 to-indigo-600" },
  { id: "rose",   label: "玫红", swatch: "bg-gradient-to-r from-rose-500 to-pink-600" },
  { id: "amber",  label: "琥珀", swatch: "bg-gradient-to-r from-amber-500 to-orange-600" },
  { id: "violet", label: "紫",   swatch: "bg-gradient-to-r from-violet-500 to-purple-600" },
  { id: "slate",  label: "墨",   swatch: "bg-gradient-to-r from-slate-700 to-slate-900" },
];

export const defaultTheme = tealEmerald;

/** 按 id 解析主题；缺省/未知回退 teal。 */
export function resolveTheme(id?: ThemeId): RendererTheme {
  return (id && THEMES[id]) || THEMES.teal;
}
