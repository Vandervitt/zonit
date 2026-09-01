// landing-renderer/sections/CaseStudy.tsx
import type { CaseStudySection, PageContact } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";
import { SectionHeading } from "../primitives/SectionHeading";
import { SectionCta } from "../primitives/SectionCta";
import { Img } from "../primitives/Img";

export function CaseStudy({
  data,
  contact,
  theme,
  preview = false,
}: {
  data: CaseStudySection;
  contact: PageContact;
  theme: RendererTheme;
  preview?: boolean;
}) {
  return (
    <SectionShell>
      <SectionHeading title={data.title} subtitle={data.subtitle} />
      {data.items.length > 0 && (
        <div className="mt-10 grid gap-6 md:grid-cols-2">
          {data.items.map((it, i) => (
            <article key={i} className="overflow-hidden rounded-2xl border border-slate-200">
              {it.image && <Img image={it.image} className="h-40 w-full object-cover" />}
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{it.client}</p>
                <h3 className="mt-1.5 text-sm font-bold text-slate-900">{it.summary}</h3>
                {it.detail && <p className="mt-2 text-xs leading-relaxed text-slate-500">{it.detail}</p>}
                {/* 指标两个字段要么都有要么不显示：只有数字没有标签是无意义的，
                    只有标签没有数字则像是数据没加载出来。 */}
                {it.metricValue && it.metricLabel && (
                  <div className="mt-4 border-t border-slate-100 pt-3">
                    <div className={`text-lg font-bold ${theme.accentText}`}>{it.metricValue}</div>
                    <div className="text-xs text-slate-500">{it.metricLabel}</div>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <SectionCta cta={data.cta} contact={contact} theme={theme} preview={preview} />
    </SectionShell>
  );
}
