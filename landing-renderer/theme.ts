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

export const defaultTheme = tealEmerald;
