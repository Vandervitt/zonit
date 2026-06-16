// landing-renderer/sections/Features.tsx
import type { FeaturesSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";

export function Features({ data, theme }: { data: FeaturesSection; theme: RendererTheme }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {data.items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-slate-200 p-5">
              {it.icon && (
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-lg ${theme.accentIconBg}`}>{it.icon}</div>
              )}
              <h3 className="mt-4 text-sm font-bold text-slate-900">{it.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{it.description}</p>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
