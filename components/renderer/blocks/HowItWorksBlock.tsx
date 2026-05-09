import type { HowItWorksSchema } from "@/types/schema";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

export function HowItWorksBlock({
  data,
  primaryColor,
  highlight,
}: {
  data: HowItWorksSchema;
  primaryColor: string;
  highlight?: boolean;
}) {
  return (
    <section id="howItWorks" className="px-5 py-10 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      <p className="text-lg text-center text-slate-800 mb-1">{data.title}</p>
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-6">{data.subtitle}</p>}
      <div className="space-y-5">
        {data.steps.map((step, i) => (
          <div key={step.id} className="flex gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-sm text-white shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              {i + 1}
            </div>
            <div className="flex-1">
              <p className="text-sm text-slate-800">{step.title}</p>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{step.description}</p>
              {step.image && (
                <img
                  src={step.image.src}
                  alt={step.image.alt}
                  className="mt-2 w-full rounded-xl object-cover max-h-32"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
