// landing-renderer/primitives/SectionHeading.tsx
import type { IconHeading } from "@/types/schema.draft";

export function SectionHeading({ title, subtitle }: { title?: string | IconHeading; subtitle?: string }) {
  // 防御：title 理论上必填，但为避免任何异常数据（如生成回填缺字段）整页白屏，缺失时优雅降级。
  const text = typeof title === "string" ? title : (title?.text ?? "");
  const icon = typeof title === "string" ? undefined : title?.icon;
  if (!text && !subtitle) return null;
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
        {icon && <span className="mr-2" aria-hidden>{icon}</span>}
        {text}
      </h2>
      {subtitle && <p className="mt-2 text-sm text-slate-500 sm:text-base">{subtitle}</p>}
    </div>
  );
}
