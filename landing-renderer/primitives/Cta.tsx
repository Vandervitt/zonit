// landing-renderer/primitives/Cta.tsx
import type { CtaButton } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Cta({ cta, theme, variant = "primary" }: { cta: CtaButton; theme: RendererTheme; variant?: "primary" | "secondary" }) {
  if (variant === "secondary") {
    return (
      <a href={cta.link} className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
        {cta.text}
      </a>
    );
  }
  return (
    <a href={cta.link} className={`inline-flex items-center justify-center rounded-xl px-5 py-3 text-sm font-bold text-white transition ${theme.accentGradient} ${theme.accentGradientHover} ${theme.accentShadow}`}>
      {cta.text}
    </a>
  );
}
