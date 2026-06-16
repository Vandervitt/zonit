// landing-renderer/sections/Story.tsx
import type { StorySection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Img } from "../primitives/Img";

export function Story({ data, theme }: { data: StorySection; theme: RendererTheme }) {
  return (
    <section className="relative overflow-hidden bg-slate-900">
      {data.backgroundImage && (
        <Img image={data.backgroundImage} className="absolute inset-0 h-full w-full object-cover opacity-25" />
      )}
      <div className="relative mx-auto max-w-3xl px-5 py-20 text-white sm:px-6">
        {data.subtitle && <div className={`text-sm font-semibold ${theme.accentText}`}>{data.subtitle}</div>}
        <h2 className="mt-2 text-2xl font-extrabold tracking-tight sm:text-3xl">{data.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-slate-300">{data.body}</p>
        {(data.signatureName || data.signatureRole) && (
          <div className="mt-6 text-sm">
            {data.signatureName && <span className="font-bold">{data.signatureName}</span>}
            {data.signatureRole && <span className="text-slate-400"> · {data.signatureRole}</span>}
          </div>
        )}
      </div>
    </section>
  );
}
