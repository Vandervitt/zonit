import type { ProofCasesSchema, ProofCaseItem } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

function CaseCard({ item, primaryColor }: { item: ProofCaseItem; primaryColor: string }) {
  const hasBeforeAfter = item.beforeImage && item.afterImage;

  return (
    <div className="bg-slate-50 rounded-xl overflow-hidden">
      {hasBeforeAfter ? (
        <div className="grid grid-cols-2 gap-0.5">
          <div className="relative">
            <img src={item.beforeImage!.src} alt={item.beforeImage!.alt} className="w-full h-28 object-cover" />
            <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">Before</span>
          </div>
          <div className="relative">
            <img src={item.afterImage!.src} alt={item.afterImage!.alt} className="w-full h-28 object-cover" />
            <span className="absolute bottom-1 left-1 text-[9px] bg-black/50 text-white px-1.5 py-0.5 rounded">After</span>
          </div>
        </div>
      ) : item.image ? (
        <img src={item.image.src} alt={item.image.alt} className="w-full h-28 object-cover" />
      ) : null}
      <div className="p-3">
        <p className="text-sm text-slate-800 mb-1">{item.title}</p>
        {item.concern && <p className="text-[10px] text-slate-400 mb-1">Concern: {item.concern}</p>}
        {item.outcome && <p className="text-xs text-slate-600 leading-relaxed">{item.outcome}</p>}
        {item.timeframe && (
          <p className="text-[10px] mt-1" style={{ color: primaryColor }}>{item.timeframe}</p>
        )}
        {item.testimonial && (
          <p className="text-[10px] text-slate-500 italic mt-2">"{item.testimonial}"</p>
        )}
        {item.cta && (
          <div className="mt-2">
            <LeadCta cta={item.cta} primaryColor={primaryColor} className="w-full py-1.5 rounded-full text-xs text-white" />
          </div>
        )}
      </div>
    </div>
  );
}

export function ProofCasesBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: ProofCasesSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="grid grid-cols-2 gap-3">
        {data.cases.map(c => <CaseCard key={c.id} item={c} primaryColor={primaryColor} />)}
      </div>
      {data.disclaimer && (
        <p className="mt-4 text-[10px] text-slate-400 text-center">{data.disclaimer}</p>
      )}
    </section>
  );
}
