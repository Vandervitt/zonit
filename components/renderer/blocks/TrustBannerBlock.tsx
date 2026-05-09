import type { TrustBannerSchema } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function TrustBannerBlock({
  data,
  id,
  highlight,
}: {
  data: TrustBannerSchema;
  id?: string;
  highlight?: boolean;
}) {
  return (
    <section id={id} className="px-4 py-4 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
        {data.badges.map(badge => (
          <div key={badge.id} className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">✦</span>
            <span className="text-xs text-slate-600">{badge.text}</span>
            {badge.subtext && <span className="text-[10px] text-slate-400">· {badge.subtext}</span>}
          </div>
        ))}
      </div>
    </section>
  );
}
