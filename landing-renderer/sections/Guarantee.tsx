// landing-renderer/sections/Guarantee.tsx
import type { GuaranteeSection } from "@/types/schema.draft";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";

export function Guarantee({ data }: { data: GuaranteeSection }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle ?? data.description} />
      {data.items.length > 0 && (
        <div className="mx-auto mt-10 grid max-w-3xl gap-5 sm:grid-cols-2">
          {data.items.map((it, i) => (
            <div key={i} className="flex items-start gap-3">
              {it.icon && <span className="text-xl">{it.icon}</span>}
              <div>
                <h3 className="text-sm font-bold text-slate-900">{it.title}</h3>
                {it.subtitle && <p className="text-xs text-slate-500">{it.subtitle}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
