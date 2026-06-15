// landing-editor/ui/Field.tsx
// Field：label 包裹单个控件（满足 a11y label 关联）。
// Group：用于多控件 / 列表分组的标题区，不使用 label 元素。
import type { ReactNode } from "react";

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-xs font-medium text-ink-soft">{label}</span>
      {children}
      {error ? (
        <span className="block text-[11px] text-red-600">{error}</span>
      ) : hint ? (
        <span className="block text-[11px] text-ink-muted">{hint}</span>
      ) : null}
    </label>
  );
}

export function Group({
  label,
  action,
  children,
}: {
  label: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-soft">{label}</span>
        {action}
      </div>
      {children}
    </div>
  );
}
