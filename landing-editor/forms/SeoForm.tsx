"use client";
// landing-editor/forms/SeoForm.tsx
// 页面 SEO 配置：标题/描述/分享图/noindex（留空回退首屏派生）。
import { useAdminT } from "@/lib/i18n/admin/context";
import type { PageSeo } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { MediaPicker } from "../ui/MediaPicker";

export function SeoForm({ value, onChange }: { value: PageSeo; onChange: (v: PageSeo) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.seo;
  const f = d.fields;
  const patch = (p: Partial<PageSeo>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <Field label={t.title}>
        <TextInput value={value.metaTitle ?? ""} onChange={(e) => patch({ metaTitle: e.target.value || undefined })} placeholder="{t.titleHint}" />
      </Field>
      <Field label={t.description}>
        <TextArea value={value.metaDescription ?? ""} onChange={(e) => patch({ metaDescription: e.target.value || undefined })} placeholder="{t.descriptionHint}" />
      </Field>
      <Field label={t.ogImage}>
        <MediaPicker value={value.ogImage ?? ""} accept="image" onChange={(src) => patch({ ogImage: src || undefined })} />
      </Field>
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={value.noindex ?? false}
          onChange={(e) => patch({ noindex: e.target.checked || undefined })}
          className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
        />
        {t.noindex}
      </label>
    </div>
  );
}
