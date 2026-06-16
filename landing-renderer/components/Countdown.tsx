// landing-renderer/components/Countdown.tsx
"use client";
import { useEffect, useState } from "react";

type Parts = { d: number; h: number; m: number; s: number };

function diff(target: number): Parts {
  const ms = Math.max(0, target - Date.now());
  const s = Math.floor(ms / 1000);
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

export function Countdown({ endsAt, tone = "dark" }: { endsAt: string; tone?: "dark" | "light" }) {
  const target = new Date(endsAt).getTime();
  const [parts, setParts] = useState<Parts | null>(null);

  useEffect(() => {
    if (Number.isNaN(target)) return;
    setParts(diff(target));
    const id = setInterval(() => setParts(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (Number.isNaN(target)) return null;
  const p = parts ?? { d: 0, h: 0, m: 0, s: 0 };
  const cellCls = tone === "light" ? "bg-slate-100 text-slate-900" : "bg-white/10 text-white";
  const labelCls = tone === "light" ? "text-slate-500" : "text-white/60";
  const cell = (v: number, label: string) => (
    <div className={`flex flex-col items-center rounded-lg px-3 py-2 ${cellCls}`}>
      <span className="text-xl font-extrabold tabular-nums">{String(v).padStart(2, "0")}</span>
      <span className={`text-[10px] uppercase ${labelCls}`}>{label}</span>
    </div>
  );

  return (
    <div className="flex justify-center gap-2">
      {cell(p.d, "days")}
      {cell(p.h, "hrs")}
      {cell(p.m, "min")}
      {cell(p.s, "sec")}
    </div>
  );
}
