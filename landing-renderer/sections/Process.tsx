// landing-renderer/sections/Process.tsx
import type { ProcessSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function Process({ data, theme }: { data: ProcessSection; theme: RendererTheme }) {
  return (
    <SectionShell tone="muted">
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.steps.length > 0 && (
        <ol className="mx-auto mt-10 grid max-w-3xl gap-3">
          {data.steps.map((s, i) => (
            <li key={i} className="flex items-center gap-4 rounded-xl border border-slate-200 bg-white p-4">
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${theme.accentGradient}`}>{i + 1}</span>
              <div className="flex-1">
                <h3 className="text-sm font-bold text-slate-900">{s.title}</h3>
                <p className="text-xs text-slate-500">{s.description}</p>
              </div>
              {s.image && <Img image={s.image} className="h-12 w-12 shrink-0 rounded-lg object-cover" />}
            </li>
          ))}
        </ol>
      )}
    </SectionShell>
  );
}
