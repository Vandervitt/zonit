const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

/**
 * 免费 / 入门套餐发布页右下角「Made with Zap Bridge」角标。
 * 可点击回注册页（带 utm，兼作获客入口）。是否渲染由发布页按套餐 `hasWatermark(plan)` 决定。
 * Tailwind only：中性 slate 配色，避免与租户品牌主题冲突。
 */
export function Watermark() {
  const href = `${APP_URL}/register?utm_source=watermark&utm_medium=powered_by`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer nofollow"
      aria-label="Made with Zap Bridge"
      className="fixed bottom-4 right-4 z-50 inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-slate-600 shadow-md backdrop-blur transition-colors hover:text-slate-900"
    >
      Made with <span className="font-semibold">Zap Bridge</span>
    </a>
  );
}
