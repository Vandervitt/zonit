// landing-renderer/sections/Trust.tsx
import type { TrustSection } from "@/types/schema.draft";
import { Img } from "../primitives/Img";

export function Trust({ data }: { data: TrustSection }) {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      {data.backgroundImage && (
        <Img image={data.backgroundImage} className="absolute inset-0 h-full w-full object-cover opacity-20" />
      )}
      <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-6">
        {data.badges.length > 0 && (
          <div className="grid gap-6 sm:grid-cols-3">
            {data.badges.map((b, i) => (
              <div key={i} className="text-center text-white">
                {b.icon && <div className="text-2xl">{b.icon}</div>}
                <h3 className="mt-2 text-sm font-bold">{b.title}</h3>
                {b.subtitle && <p className="text-xs text-white/60">{b.subtitle}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
