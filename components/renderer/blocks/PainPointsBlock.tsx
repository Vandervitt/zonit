import type { PainPointsSchema } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function PainPointsBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: PainPointsSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="space-y-4">
        {data.items.map(item => (
          <div key={item.id} className="flex gap-3 items-start bg-slate-50 rounded-xl p-4">
            {item.visual ? (
              <img src={item.visual.src} alt={item.visual.alt} className="w-16 h-16 rounded-lg object-cover shrink-0" />
            ) : (
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0"
                style={{ backgroundColor: primaryColor + "15", color: primaryColor }}
              >
                {item.icon ?? "·"}
              </div>
            )}
            <div>
              <p className="text-sm text-slate-800 mb-0.5">{item.title}</p>
              <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
            </div>
          </div>
        ))}
      </div>
      {data.cta && (
        <div className="mt-6 text-center">
          <LeadCta cta={data.cta} primaryColor={primaryColor} className="px-5 py-2.5 rounded-full text-sm text-white" />
        </div>
      )}
    </section>
  );
}
