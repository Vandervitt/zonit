// landing-renderer/sections/Stats.tsx
import type { StatsSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";

export function Stats({ data, theme }: { data: StatsSection; theme: RendererTheme }) {
  return (
    <section className="bg-slate-900">
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{data.title}</h2>
          {data.subtitle && <p className="mt-2 text-sm text-slate-400">{data.subtitle}</p>}
        </div>
        {data.items.length > 0 && (
          <div className="mt-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {data.items.map((it, i) => (
              <div key={i} className={`rounded-2xl p-5 text-center ${theme.glassCard}`}>
                {it.icon && <div className="text-lg">{it.icon}</div>}
                <div className={`mt-1 text-3xl font-extrabold ${theme.accentTextGradient}`}>{it.value}</div>
                <div className="mt-1 text-xs text-slate-400">{it.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
