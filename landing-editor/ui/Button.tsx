// landing-editor/ui/Button.tsx
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "subtle" | "ghost" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-brand-600 text-white hover:bg-brand-700",
  subtle: "bg-brand-50 text-brand-700 hover:bg-brand-100",
  ghost: "text-ink-muted hover:bg-brand-50 hover:text-ink",
  danger: "text-red-600 hover:bg-red-50",
};

export function Button({
  variant = "subtle",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type={type}
      className={`inline-flex select-none items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-sm font-medium leading-none transition-colors disabled:pointer-events-none disabled:opacity-40 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
