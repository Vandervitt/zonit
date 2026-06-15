// landing-editor/ui/Select.tsx
import type { SelectHTMLAttributes } from "react";

export function Select({ className = "", children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-md border border-edge bg-panel px-2.5 py-1.5 text-sm text-ink transition-colors focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}
