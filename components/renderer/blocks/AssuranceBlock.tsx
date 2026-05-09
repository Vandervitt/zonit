import type { AssuranceSchema } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function AssuranceBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: AssuranceSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="flex flex-col items-center text-center">
        {data.image && <img src={data.image} alt="" className="w-20 h-20 object-contain mb-3" />}
        <p className="text-lg text-slate-800 mb-1">{data.title}</p>
        {data.subtitle && <p className="text-xs text-slate-500 mb-3">{data.subtitle}</p>}
        {data.description && (
          <p className="text-xs text-slate-600 leading-relaxed mb-5 max-w-sm">{data.description}</p>
        )}
        {data.badges && data.badges.length > 0 && (
          <div className="grid grid-cols-3 gap-3 w-full mb-4">
            {data.badges.map(badge => (
              <div key={badge.id} className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center mb-1.5 text-sm"
                  style={{ backgroundColor: primaryColor + "20", color: primaryColor }}
                >
                  ✓
                </div>
                <p className="text-[11px] text-slate-700 leading-tight">{badge.text}</p>
                {badge.subtext && <p className="text-[9px] text-slate-400 mt-0.5">{badge.subtext}</p>}
              </div>
            ))}
          </div>
        )}
        {data.cta && (
          <LeadCta cta={data.cta} primaryColor={primaryColor} className="px-5 py-2.5 rounded-full text-sm text-white" />
        )}
      </div>
    </section>
  );
}
