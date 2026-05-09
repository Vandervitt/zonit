import type { ConsultationOptionsSchema, OfferOption } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

function OptionCard({
  option,
  primaryColor,
  showImage,
}: {
  option: OfferOption;
  primaryColor: string;
  showImage: boolean;
}) {
  return (
    <div
      className="border-2 rounded-2xl p-4 relative"
      style={{ borderColor: option.badge ? primaryColor : "#e2e8f0" }}
    >
      {option.badge && (
        <div
          className="absolute -top-3 left-4 px-2 py-0.5 rounded-full text-xs text-white"
          style={{ backgroundColor: primaryColor }}
        >
          {option.badge}
        </div>
      )}
      <p className="text-sm text-slate-800">{option.name}</p>
      <p className="text-xs text-slate-500 mb-2">{option.description}</p>
      {showImage && option.image && (
        <img src={option.image} alt="" className="w-full h-24 object-cover rounded-xl mb-3" />
      )}
      <ul className="space-y-1 my-3">
        {option.valueProps.map((f, i) => (
          <li key={i} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="text-emerald-500 text-base leading-none">✓</span> {f}
          </li>
        ))}
      </ul>
      {option.urgencyText && (
        <p className="text-[10px] text-amber-600 text-center mb-2">{option.urgencyText}</p>
      )}
      <LeadCta cta={option.cta} primaryColor={primaryColor} className="w-full py-2 rounded-full text-xs text-white mt-2" />
    </div>
  );
}

export function OfferBlock({
  data,
  primaryColor,
  highlight,
}: {
  data: ConsultationOptionsSchema;
  primaryColor: string;
  highlight?: boolean;
}) {
  return (
    <section id="offer" className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="grid grid-cols-2 gap-3">
        {data.options.map(opt => (
          <OptionCard key={opt.id} option={opt} primaryColor={primaryColor} showImage={!!data.showImages} />
        ))}
      </div>
    </section>
  );
}
