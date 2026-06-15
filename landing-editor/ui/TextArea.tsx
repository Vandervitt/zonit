// landing-editor/ui/TextArea.tsx
import type { TextareaHTMLAttributes } from "react";

export function TextArea({ className = "", rows = 3, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      rows={rows}
      className={`w-full resize-y rounded-md border border-edge bg-panel px-2.5 py-1.5 text-sm text-ink transition-colors placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 ${className}`}
      {...props}
    />
  );
}
