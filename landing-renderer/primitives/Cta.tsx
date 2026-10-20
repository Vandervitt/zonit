// landing-renderer/primitives/Cta.tsx
import type { CtaButton, PageContact } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { resolveCtaHref, resolveCtaChannel } from "../lib/resolveCta";
import { PREVIEW_LABELS, type PreviewMode } from "../preview";
import type { Locale } from "@/lib/i18n/config";

/** 不完整按钮缺失项的提示文案（预览占位用，语言跟随看预览的运营者）。 */
export function missingCtaLabel(cta: CtaButton, contact: PageContact, locale: Locale): string {
  const l = PREVIEW_LABELS[locale];
  const parts = [
    !resolveCtaHref(cta.target, contact) && l.contactMissing,
    !cta.text?.trim() && l.textMissing,
  ].filter(Boolean);
  return `${parts.join(l.separator)} · ${l.notLive}`;
}

export function Cta({ cta, contact, theme, variant = "primary", preview = false }: { cta: CtaButton; contact: PageContact; theme: RendererTheme; variant?: "primary" | "secondary"; preview?: PreviewMode }) {
  const resolved = resolveCtaHref(cta.target, contact);
  // 落点解析不出或文案为空：线上不渲染（避免 href="" 死按钮）；预览渲染不可点击的虚线占位，
  // 让用户在编辑时看得到按钮位置，同时明确知道「未填完整、发布后不会出现」。
  if (!resolved || !cta.text?.trim()) {
    if (!preview) return null;
    return (
      <span className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-amber-400 bg-amber-50 px-5 py-3 text-sm font-semibold text-amber-700">
        {cta.text?.trim() || PREVIEW_LABELS[preview].ctaFallback}
        <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium">{missingCtaLabel(cta, contact, preview)}</span>
      </span>
    );
  }
  // 埋点渠道不再从 URL 前缀反推——现在它是显式的，inferChannel 那套猜测可以退休了
  const dataCta = resolveCtaChannel(cta.target, contact);
  if (variant === "secondary") {
    return (
      <a href={resolved.href} data-cta={dataCta} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {cta.text}
      </a>
    );
  }
  return (
    <a href={resolved.href} data-cta={dataCta} className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}>
      {cta.text}
    </a>
  );
}
