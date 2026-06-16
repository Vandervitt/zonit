// landing-renderer/sections/BeforeAfter.tsx
import type { BeforeAfterSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function BeforeAfter({ data, theme }: { data: BeforeAfterSection; theme: RendererTheme }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {data.items.map((it, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
              <div className="grid grid-cols-2">
                <div className="relative">
                  <Img image={it.beforeImage} className="h-44 w-full object-cover" />
                  <span className="absolute bottom-2 left-2 rounded bg-slate-900/70 px-2 py-0.5 text-[10px] font-semibold text-white">BEFORE</span>
                </div>
                <div className="relative">
                  <Img image={it.afterImage} className="h-44 w-full object-cover" />
                  <span className={`absolute bottom-2 left-2 rounded px-2 py-0.5 text-[10px] font-semibold text-white ${theme.accentGradient}`}>AFTER</span>
                </div>
              </div>
              <div className="p-4">
                <div className="text-sm font-bold text-slate-900">{it.crmName} · {it.duration}</div>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{it.caseDescription}</p>
              </div>
            </div>
          ))}
        </div>
      )}
      {data.disclaimer && (
        <p className="mx-auto mt-8 max-w-3xl text-center text-[11px] leading-relaxed text-slate-400">{data.disclaimer}</p>
      )}
    </SectionShell>
  );
}
