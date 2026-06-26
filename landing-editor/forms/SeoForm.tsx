"use client";
// landing-editor/forms/SeoForm.tsx
// 页面 SEO 配置：标题/描述/分享图/noindex（留空回退首屏派生）。
import type { PageSeo } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { MediaPicker } from "../ui/MediaPicker";

export function SeoForm({ value, onChange }: { value: PageSeo; onChange: (v: PageSeo) => void }) {
  const patch = (p: Partial<PageSeo>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <Field label="页面标题（留空用首屏标题，建议 ≤60 字）">
        <TextInput value={value.metaTitle ?? ""} onChange={(e) => patch({ metaTitle: e.target.value || undefined })} placeholder="搜索结果 / 浏览器标签显示的标题" />
      </Field>
      <Field label="页面描述（留空用首屏副标题，建议 ≤160 字）">
        <TextArea value={value.metaDescription ?? ""} onChange={(e) => patch({ metaDescription: e.target.value || undefined })} placeholder="搜索结果摘要 / 社交分享描述" />
      </Field>
      <Field label="社交分享图（留空用首屏图）">
        <MediaPicker value={value.ogImage ?? ""} accept="image" onChange={(src) => patch({ ogImage: src || undefined })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={value.noindex ?? false}
          onChange={(e) => patch({ noindex: e.target.checked || undefined })}
          className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
        />
        禁止搜索引擎收录此页（noindex）
      </label>
    </div>
  );
}
