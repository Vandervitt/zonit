import type { LeadMagnetSchema } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function LeadMagnetBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: LeadMagnetSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section
      id={id}
      className="mx-5 my-8 rounded-2xl p-6 text-center"
      style={{
        backgroundColor: primaryColor + "10",
        border: `1px solid ${primaryColor}30`,
        boxShadow: highlight ? HIGHLIGHT_STYLE : undefined,
      }}
    >
      {data.image && (
        <img src={data.image.src} alt={data.image.alt} className="w-20 h-20 rounded-xl object-cover mx-auto mb-4" />
      )}
      <p className="text-base text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-slate-500 mb-3">{data.subtitle}</p>}
      <div
        className="inline-block px-3 py-1 rounded-full text-xs mb-4"
        style={{ backgroundColor: primaryColor, color: "#fff" }}
      >
        {data.incentive}
      </div>
      <ul className="space-y-1.5 mb-4 text-left max-w-xs mx-auto">
        {data.valueProps.map((prop, i) => (
          <li key={i} className="flex items-center gap-2 text-xs text-slate-700">
            <span className="text-emerald-500">✓</span> {prop}
          </li>
        ))}
      </ul>
      <LeadCta cta={data.cta} primaryColor={primaryColor} className="px-6 py-2.5 rounded-full text-sm text-white" />
      {data.trustText && (
        <p className="text-[10px] text-slate-400 mt-2">{data.trustText}</p>
      )}
    </section>
  );
}
