// landing-renderer/sections/Hero.tsx
import type { HeroSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import type { HeroLayout } from "../variant";
import { Img } from "../primitives/Img";
import { Media } from "../primitives/Media";
import { Badge } from "../primitives/Badge";
import { Cta } from "../primitives/Cta";

interface HeroProps {
  data: HeroSection;
  theme: RendererTheme;
  logo?: string;
  layout?: HeroLayout; // 反同质化布局变体；缺省 background（与改造前一致）
  preview?: boolean;   // 预览渲染：不完整 CTA 显示占位而非隐藏
}

export function Hero({ data, theme, logo, layout = "background", preview }: HeroProps) {
  if (layout === "centered") return <HeroCentered data={data} theme={theme} logo={logo} preview={preview} />;
  if (layout === "split-right" || layout === "split-left")
    return <HeroSplit data={data} theme={theme} logo={logo} preview={preview} side={layout === "split-left" ? "left" : "right"} />;
  return <HeroBackground data={data} theme={theme} logo={logo} preview={preview} />;
}

/** 原始布局：淡背景图 + 左对齐堆叠，展示图在下（改造前逐字节一致，守零回归）。 */
function HeroBackground({ data, theme, logo, preview }: { data: HeroSection; theme: RendererTheme; logo?: string; preview?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      {data.backgroundImage && (
        <Img image={data.backgroundImage} className="absolute inset-0 h-full w-full object-cover opacity-15" />
      )}
      <div className="relative mx-auto max-w-6xl px-5 py-20 sm:px-6">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="mb-5 h-10 w-auto" />
        ) : null}
        {data.badge && <Badge badge={data.badge} theme={theme} />}
        <h1 className="mt-5 max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          {data.title}
        </h1>
        {data.subtitle && <p className="mt-4 max-w-xl text-base text-slate-600 sm:text-lg">{data.subtitle}</p>}
        <div className="mt-7 flex flex-wrap gap-3">
          <Cta cta={data.cta} theme={theme} preview={preview} />
          {data.secondaryCta && <Cta cta={data.secondaryCta} theme={theme} variant="secondary" preview={preview} />}
        </div>
        {data.endorsementText && <p className="mt-4 text-sm text-slate-500">{data.endorsementText}</p>}
        {data.showcase && <Media media={data.showcase} className="mt-10 w-full rounded-2xl object-cover shadow-xl" />}
      </div>
    </section>
  );
}

/** 分栏布局：文案一栏 + 展示图一栏；side 决定图在左/右（lg 以上）。 */
function HeroSplit({
  data,
  theme,
  logo,
  side,
  preview,
}: {
  data: HeroSection;
  theme: RendererTheme;
  logo?: string;
  side: "left" | "right";
  preview?: boolean;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-20 sm:px-6 lg:grid-cols-2">
        <div className={side === "left" ? "lg:order-2" : ""}>
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logo} alt="" className="mb-5 h-10 w-auto" />
          ) : null}
          {data.badge && <Badge badge={data.badge} theme={theme} />}
          <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
            {data.title}
          </h1>
          {data.subtitle && <p className="mt-4 text-base text-slate-600 sm:text-lg">{data.subtitle}</p>}
          <div className="mt-7 flex flex-wrap gap-3">
            <Cta cta={data.cta} theme={theme} preview={preview} />
            {data.secondaryCta && <Cta cta={data.secondaryCta} theme={theme} variant="secondary" preview={preview} />}
          </div>
          {data.endorsementText && <p className="mt-4 text-sm text-slate-500">{data.endorsementText}</p>}
        </div>
        {data.showcase && (
          <div className={side === "left" ? "lg:order-1" : ""}>
            <Media media={data.showcase} className="w-full rounded-2xl object-cover shadow-xl" />
          </div>
        )}
      </div>
    </section>
  );
}

/** 居中布局：文案居中，展示图在下居中。 */
function HeroCentered({ data, theme, logo, preview }: { data: HeroSection; theme: RendererTheme; logo?: string; preview?: boolean }) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white">
      <div className="relative mx-auto max-w-3xl px-5 py-20 text-center sm:px-6">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logo} alt="" className="mx-auto mb-5 h-10 w-auto" />
        ) : null}
        {data.badge && <Badge badge={data.badge} theme={theme} />}
        <h1 className="mt-5 text-4xl font-extrabold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">
          {data.title}
        </h1>
        {data.subtitle && <p className="mx-auto mt-4 max-w-xl text-base text-slate-600 sm:text-lg">{data.subtitle}</p>}
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Cta cta={data.cta} theme={theme} preview={preview} />
          {data.secondaryCta && <Cta cta={data.secondaryCta} theme={theme} variant="secondary" preview={preview} />}
        </div>
        {data.endorsementText && <p className="mt-4 text-sm text-slate-500">{data.endorsementText}</p>}
        {data.showcase && (
          <Media media={data.showcase} className="mx-auto mt-10 w-full rounded-2xl object-cover shadow-xl" />
        )}
      </div>
    </section>
  );
}
