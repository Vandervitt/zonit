"use client";
// landing-editor/forms/BrandingForm.tsx
// 品牌主题配置：6 套主题色卡选择 + Logo / favicon 上传。
import type { Branding } from "@/types/schema.draft";
import { THEME_META } from "@/landing-renderer/theme";
import { Field } from "../ui/Field";
import { MediaPicker } from "../ui/MediaPicker";

export function BrandingForm({ value, onChange }: { value: Branding; onChange: (v: Branding) => void }) {
  return (
    <div className="space-y-4">
      <Field label="主题配色">
        <div className="grid grid-cols-3 gap-2">
          {THEME_META.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => onChange({ ...value, theme: m.id })}
              className={
                "flex flex-col items-center gap-1.5 rounded-lg border p-2 transition " +
                (value.theme === m.id ? "border-brand-500 bg-brand-50" : "border-edge hover:border-edge-strong")
              }
            >
              <span className={`h-8 w-full rounded-md ${m.swatch}`} />
              <span className="text-xs text-ink">{m.label}</span>
            </button>
          ))}
        </div>
      </Field>
      <Field label="品牌 Logo（宽图，显示在首屏与页脚）">
        <MediaPicker value={value.logo ?? ""} accept="image" onChange={(src) => onChange({ ...value, logo: src })} />
      </Field>
      <Field label="Favicon（方形小图，浏览器标签图标）">
        <MediaPicker value={value.favicon ?? ""} accept="image" onChange={(src) => onChange({ ...value, favicon: src })} />
      </Field>
    </div>
  );
}
