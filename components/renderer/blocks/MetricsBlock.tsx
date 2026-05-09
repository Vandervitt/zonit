import type { MetricsSchema } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function MetricsBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: MetricsSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      {data.title && <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>}
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="grid grid-cols-2 gap-4">
        {data.items.map(item => (
          <div key={item.id} className="bg-white rounded-xl p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: primaryColor }}>{item.value}</p>
            <p className="text-xs text-slate-700 mt-0.5">{item.label}</p>
            {item.context && <p className="text-[10px] text-slate-400 mt-1">{item.context}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}
