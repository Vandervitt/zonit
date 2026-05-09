import type { FAQSchema } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function FAQBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: FAQSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="space-y-3">
        {data.items.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4">
            <p className="text-sm text-slate-800 mb-1.5">{item.question}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{item.answer}</p>
          </div>
        ))}
      </div>
      {data.contactCta && (
        <div className="mt-6 text-center">
          <LeadCta cta={data.contactCta} primaryColor={primaryColor} className="px-5 py-2.5 rounded-full text-sm text-white" />
        </div>
      )}
    </section>
  );
}
