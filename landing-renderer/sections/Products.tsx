// landing-renderer/sections/Products.tsx
import type { ProductsSection } from "@/types/schema.draft";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function Products({ data }: { data: ProductsSection }) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.items.map((it, i) => (
            <div key={i} className="overflow-hidden rounded-2xl border border-slate-200">
              {it.backgroundImage && <Img image={it.backgroundImage} className="h-40 w-full object-cover" />}
              <div className="p-5">
                <h3 className="text-sm font-bold text-slate-900">{it.name}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-slate-500">{it.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
