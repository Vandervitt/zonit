// landing-renderer/sections/Faq.tsx
import type { FaqSection } from "@/types/schema.draft";
import type { RendererTheme } from "../theme";
import { SectionShell } from "../primitives/SectionShell";

export function Faq({ data, theme }: { data: FaqSection; theme: RendererTheme }) {
  return (
    <SectionShell tone="muted">
      <h2 className="text-center text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {data.title.icon && <span className="mr-2" aria-hidden>{data.title.icon}</span>}
        {data.title.text}
      </h2>
      {data.subtitle && <p className="mt-2 text-center text-sm text-slate-500">{data.subtitle}</p>}
      {data.items.length > 0 && (
        <div className="mx-auto mt-8 max-w-2xl space-y-2.5">
          {data.items.map((it, i) => (
            <details key={i} className="group rounded-xl border border-slate-200 bg-white p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-sm font-bold text-slate-900">
                {it.question}
                <span className={`ml-2 transition group-open:rotate-45 ${theme.accentText}`}>+</span>
              </summary>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">{it.answer}</p>
            </details>
          ))}
        </div>
      )}
    </SectionShell>
  );
}
