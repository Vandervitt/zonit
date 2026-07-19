// landing-renderer/primitives/Cta.tsx
import type { CtaButton } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { inferChannel } from "../tracking/events";

/** 不完整按钮缺失项的提示文案（预览占位用）。 */
export function missingCtaLabel(cta: CtaButton): string {
  const parts = [!cta.link?.trim() && "链接未填", !cta.text?.trim() && "文案未填"].filter(Boolean);
  return `${parts.join("、")} · 线上不显示`;
}

export function Cta({ cta, theme, variant = "primary", preview = false }: { cta: CtaButton; theme: RendererTheme; variant?: "primary" | "secondary"; preview?: boolean }) {
  // 链接或文案为空：线上不渲染（避免 href="" 死按钮）；预览渲染不可点击的虚线占位，
  // 让用户在编辑时看得到按钮位置，同时明确知道「未填完整、发布后不会出现」。
  if (!cta.link?.trim() || !cta.text?.trim()) {
    if (!preview) return null;
    return (
      <span className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700">
        {cta.text?.trim() || "CTA 按钮"}
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium">{missingCtaLabel(cta)}</span>
      </span>
    );
  }
  const dataCta = inferChannel(cta.link);
  if (variant === "secondary") {
    return (
      <a href={cta.link} data-cta={dataCta} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {cta.text}
      </a>
    );
  }
  return (
    <a href={cta.link} data-cta={dataCta} className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}>
      {cta.text}
    </a>
  );
}
