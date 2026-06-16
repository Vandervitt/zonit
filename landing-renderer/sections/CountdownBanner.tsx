// landing-renderer/sections/CountdownBanner.tsx
import type { CountdownSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { Countdown } from "../components/Countdown";

export function CountdownBanner({ data, theme }: { data: CountdownSection; theme: RendererTheme }) {
  return (
    <section className={theme.accentGradient}>
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-5 px-5 py-14 text-center text-white sm:px-6">
        <h2 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          {data.title.icon && <span className="mr-2" aria-hidden>{data.title.icon}</span>}
          {data.title.text}
        </h2>
        {data.subtitle && <p className="text-sm text-white/80">{data.subtitle}</p>}
        <Countdown endsAt={data.endsAt} />
      </div>
    </section>
  );
}
