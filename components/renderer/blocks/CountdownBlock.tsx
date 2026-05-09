"use client";

import { useEffect, useState } from "react";
import type { CountdownSchema } from "@/types/schema";
import { LeadCta } from "@/components/renderer/LeadCta";

const HIGHLIGHT_STYLE = "0 0 0 3px #3b82f6";

function useTimeLeft(endsAt: string) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const end = new Date(endsAt).getTime();
  const diff = Math.max(0, end - now);
  const total = Math.floor(diff / 1000);
  return {
    expired: diff === 0,
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

export function CountdownBlock({
  data,
  primaryColor,
  id,
  highlight,
}: {
  data: CountdownSchema;
  primaryColor: string;
  id?: string;
  highlight?: boolean;
}) {
  const t = useTimeLeft(data.endsAt);

  const cell = (n: number, label: string) => (
    <div key={label} className="flex flex-col items-center">
      <div className="px-3 py-2 text-2xl rounded-lg text-white tabular-nums" style={{ backgroundColor: primaryColor }}>
        {String(n).padStart(2, "0")}
      </div>
      <span className="text-[10px] text-slate-500 mt-1 uppercase tracking-wider">{label}</span>
    </div>
  );

  return (
    <section id={id} className="px-5 py-8 bg-slate-50" style={{ boxShadow: highlight ? HIGHLIGHT_STYLE : undefined }}>
      {data.title && <p className="text-base text-center text-slate-800 mb-1">{data.title}</p>}
      {data.subtitle && <p className="text-xs text-center text-slate-500 mb-4">{data.subtitle}</p>}
      {t.expired ? (
        <div className="text-center">
          <p className="text-sm text-slate-700">{data.expiredFallback?.title ?? "Consultation window updated"}</p>
          {data.expiredFallback?.subtitle && (
            <p className="text-xs text-slate-500 mt-1">{data.expiredFallback.subtitle}</p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2">
          {cell(t.days, "Days")}
          {cell(t.hours, "Hrs")}
          {cell(t.minutes, "Min")}
          {cell(t.seconds, "Sec")}
        </div>
      )}
      {data.cta && (
        <div className="text-center mt-4">
          <LeadCta cta={data.cta} primaryColor={primaryColor} className="inline-flex px-5 py-2.5 rounded-full text-sm text-white" />
        </div>
      )}
    </section>
  );
}
