// landing-renderer/primitives/SectionShell.tsx
import type { ReactNode } from "react";

export function SectionShell({ children, tone = "light", className }: { children: ReactNode; tone?: "light" | "muted"; className?: string }) {
  const toneClass = tone === "muted" ? "bg-slate-50" : "bg-white";
  return (
    <section className={`${toneClass} ${className ?? ""}`}>
      <div className="mx-auto max-w-6xl px-5 py-16 sm:px-6">{children}</div>
    </section>
  );
}
