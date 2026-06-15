// landing-editor/ui/Card.tsx
import type { ReactNode } from "react";

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-edge bg-panel ${className}`}>{children}</div>;
}
