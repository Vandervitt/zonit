// landing-renderer/sections/Plans.tsx
import type { PlansSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Cta } from "../primitives/Cta";
import { Countdown } from "../components/Countdown";

export function Plans({ data, theme }: { data: PlansSection; theme: RendererTheme }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-3">
          {data.items.map((p, i) => (
            <div key={i} className="flex flex-col rounded-2xl border border-slate-200 p-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900">{p.name}</h3>
                {p.badge && (
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${theme.accentSoftBg} ${theme.accentSoftText}`}>{p.badge}</span>
                )}
              </div>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{p.description}</p>
              {p.label && <div className={`mt-4 text-sm font-bold ${theme.accentText}`}>{p.label}</div>}
              {p.valueProps.length > 0 && (
                <ul className="mt-4 space-y-2">
                  {p.valueProps.map((v, j) => (
                    <li key={j} className="flex items-start gap-2 text-xs text-slate-600">
                      <span className={theme.accentText}>✓</span>
                      <span>{v}</span>
                    </li>
                  ))}
                </ul>
              )}
              {p.countdown && (
                <div className="mt-4">
                  <Countdown endsAt={p.countdown.endsAt} tone="light" />
                </div>
              )}
              <div className="mt-6 pt-2">
                <Cta cta={p.cta} theme={theme} />
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
