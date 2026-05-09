import type { AuthoritySchema } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function AuthorityBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: AuthoritySchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="flex gap-4 items-start">
        {data.image?.src && (
          <div className="w-2/5 shrink-0">
            <img src={data.image.src} alt={data.image.alt} className="w-full h-28 object-cover rounded-xl" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base text-slate-800 mb-1">{data.title}</p>
          {data.subtitle && <p className="text-xs text-slate-500 mb-3">{data.subtitle}</p>}
          <div className="space-y-1.5">
            {data.paragraphs.map((p, i) => (
              <p key={i} className="text-xs text-slate-600 leading-relaxed">{p}</p>
            ))}
          </div>
          {data.stats && data.stats.length > 0 && (
            <div className="flex gap-4 mt-4 pt-3 border-t border-slate-200">
              {data.stats.map((s, i) => (
                <div key={i} className="text-center">
                  <p className="text-lg" style={{ color: primaryColor }}>{s.value}</p>
                  <p className="text-[10px] text-slate-500">{s.label}</p>
                </div>
              ))}
            </div>
          )}
          {data.credentials && data.credentials.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.credentials.map(c => (
                <div key={c.id} className="flex items-center gap-1 bg-white rounded-lg px-2 py-1 border border-slate-200">
                  {c.image && <img src={c.image} alt={c.label} className="w-4 h-4 object-contain" />}
                  <span className="text-[10px] text-slate-600">{c.label}</span>
                </div>
              ))}
            </div>
          )}
          {data.signature && (
            <div className="mt-3 pt-2 border-t border-slate-200">
              <p className="text-sm text-slate-800">{data.signature.name}</p>
              <p className="text-xs text-slate-500">{data.signature.role}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
