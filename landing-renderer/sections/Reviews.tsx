// landing-renderer/sections/Reviews.tsx
import type { ReviewsSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { Img } from "../primitives/Img";

export function Reviews({ data, theme }: { data: ReviewsSection; theme: RendererTheme }) {
  return (
    <SectionShell tone="muted">
      <SectionHeading title={data.title} subtitle={data.subtitle ?? data.description} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {data.items.map((it, i) => (
            <figure key={i} className="rounded-2xl border border-slate-200 bg-white p-5">
              <blockquote className="text-sm italic leading-relaxed text-slate-700">"{it.content.text}"</blockquote>
              {it.content.image && <Img image={it.content.image} className="mt-3 w-full rounded-lg object-cover" />}
              <figcaption className="mt-4 flex items-center gap-2">
                {it.avatar && <Img image={it.avatar} className="h-8 w-8 rounded-full object-cover" />}
                <span className="text-xs text-slate-500">
                  <span className="font-bold text-slate-800">{it.name}</span>
                  {it.location && <> · {it.location}</>}
                  {it.channel && <span className={theme.accentText}> · {it.channel}</span>}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
