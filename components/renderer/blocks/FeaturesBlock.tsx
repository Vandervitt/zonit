import type { FeaturesSchema } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function FeaturesBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: FeaturesSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-10" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="grid grid-cols-2 gap-4">
        {data.items.map(item => (
          <div key={item.id} className="bg-slate-50 rounded-xl p-4">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 text-sm"
              style={{ backgroundColor: primaryColor + "20", color: primaryColor }}
            >
              ◆
            </div>
            <p className="text-sm text-slate-800 mb-1">{item.title}</p>
            <p className="text-xs text-slate-500 leading-relaxed">{item.description}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
