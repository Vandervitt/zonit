// landing-renderer/sections/Hero.tsx
import type { HeroSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Img } from "../primitives/Img";
import { Media } from "../primitives/Media";
import { Badge } from "../primitives/Badge";
import { Cta } from "../primitives/Cta";

export function Hero({ data, theme }: { data: HeroSection; theme: RendererTheme }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {data.backgroundImage && (
        <Img image={data.backgroundImage} className="absolute inset-0 h-full w-full object-cover opacity-15" />
      )}
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6">
        {data.badge && <Badge badge={data.badge} theme={theme} />}
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          {data.title}
        </h1>
        {data.subtitle && <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">{data.subtitle}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <Cta cta={data.cta} theme={theme} />
          {data.secondaryCta && <Cta cta={data.secondaryCta} theme={theme} variant="secondary" />}
        </div>
        {data.endorsementText && <p className="mt-4 text-sm text-slate-500">{data.endorsementText}</p>}
        {data.showcase && <Media media={data.showcase} className="mt-10 w-full rounded-2xl object-cover shadow-xl" />}
      </div>
    </section>
  );
}
