import type { VisualGallerySchema } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function VisualGalleryBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: VisualGallerySchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      {(data.title || data.subtitle) && (
        <div className="px-5 mb-4">
          <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
          {data.subtitle && <p className="text-xs text-center text-slate-500">{data.subtitle}</p>}
        </div>
      )}
      <div className="grid grid-cols-2 gap-1 px-5">
        {data.items.map((item, i) => (
          <div key={item.id} className={`relative overflow-hidden rounded-xl ${i === 0 ? "col-span-2 h-44" : "h-28"}`}>
            <img
              src={item.image.src}
              alt={item.image.alt}
              className="w-full h-full object-cover"
            />
            {(item.title || item.tag) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                {item.tag && (
                  <span className="text-[9px] text-white/80 uppercase tracking-wider">{item.tag}</span>
                )}
                {item.title && <p className="text-xs text-white">{item.title}</p>}
              </div>
            )}
          </div>
        ))}
      </div>
      {data.disclaimer && (
        <p className="px-5 mt-3 text-[10px] text-slate-400 text-center">{data.disclaimer}</p>
      )}
      {data.cta && (
        <div className="px-5 mt-5 text-center">
          <LeadCta cta={data.cta} primaryColor={primaryColor} className="px-5 py-2.5 rounded-full text-sm text-white" />
        </div>
      )}
    </section>
  );
}
