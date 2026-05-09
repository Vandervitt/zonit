import type { HeroSchema } from "@/types/schema";
import { BackgroundType } from "@/lib/constants";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function HeroBlock({
  data,
  primaryColor,
  highlight,
}: {
  data: HeroSchema;
  primaryColor: string;
  highlight?: boolean;
}) {
  const bgImg = data.background.type === BackgroundType.Image ? data.background.value : undefined;
  const bgColor = data.background.type === BackgroundType.Color ? data.background.value : undefined;
  const overlay = data.background.overlay ?? (bgImg ? "rgba(0,0,0,0.4)" : undefined);
  const onDark = !!bgImg || data.background.type === "video" || data.background.type === "gradient";

  return (
    <section
      id="hero"
      className="relative px-5 py-12 text-center"
      style={{
        backgroundColor: bgColor ?? "#f8f9ff",
        backgroundImage: bgImg ? `url(${bgImg})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        boxShadow: highlight ? HIGHLIGHT_STYLE : undefined,
      }}
    >
      {overlay && <div className="absolute inset-0" style={{ backgroundColor: overlay }} />}
      <div className={`relative z-10 ${data.layout === "split" ? "flex items-center gap-6 text-left" : ""}`}>
        <div className="flex-1">
          {data.badge && (
            <div
              className="inline-block px-3 py-1 rounded-full text-xs mb-4"
              style={{ backgroundColor: primaryColor + "20", color: primaryColor }}
            >
              {data.badge}
            </div>
          )}
          <h1
            className="text-2xl leading-snug mb-3"
            style={{ color: onDark ? "#fff" : "#1e293b", whiteSpace: "pre-line" }}
          >
            {data.title}
          </h1>
          <p
            className="text-sm leading-relaxed mb-6 max-w-sm mx-auto"
            style={{ color: onDark ? "rgba(255,255,255,0.85)" : "#64748b" }}
          >
            {data.subtitle}
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <LeadCta cta={data.cta} primaryColor={primaryColor} className="px-5 py-2.5 rounded-full text-sm text-white" />
            {data.secondaryCta && (
              <LeadCta
                cta={data.secondaryCta}
                primaryColor={primaryColor}
                className="px-5 py-2.5 rounded-full text-sm border"
              />
            )}
          </div>
          {data.trustText && (
            <p className="text-xs mt-3" style={{ color: onDark ? "rgba(255,255,255,0.7)" : "#94a3b8" }}>
              {data.trustText}
            </p>
          )}
          {data.stats && data.stats.length > 0 && (
            <div className="flex flex-wrap justify-center gap-4 mt-6 pt-4 border-t border-white/20">
              {data.stats.map(stat => (
                <div key={stat.id} className="text-center">
                  {stat.value && (
                    <p className="text-xl font-semibold" style={{ color: onDark ? "#fff" : primaryColor }}>
                      {stat.value}
                    </p>
                  )}
                  <p className="text-xs" style={{ color: onDark ? "rgba(255,255,255,0.7)" : "#64748b" }}>
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        {data.layout === "split" && data.media && (
          <div className="w-2/5 shrink-0">
            {data.media.type === "image" ? (
              <img src={data.media.src} alt={data.media.alt ?? ""} className="w-full rounded-2xl object-cover" />
            ) : (
              <video src={data.media.src} poster={data.media.poster} className="w-full rounded-2xl" autoPlay muted loop playsInline />
            )}
          </div>
        )}
      </div>
    </section>
  );
}
