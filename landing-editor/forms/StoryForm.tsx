"use client";
// landing-editor/forms/StoryForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { StorySection } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";

export function StoryForm({ value, onChange }: { value: StorySection; onChange: (v: StorySection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.story;
  const f = d.fields;
  const patch = (p: Partial<StorySection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label={t.body}>
        <TextArea rows={5} value={value.body} onChange={(e) => patch({ body: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label={t.author}>
          <TextInput value={value.signatureName ?? ""} onChange={(e) => patch({ signatureName: e.target.value || undefined })} placeholder={t.authorPlaceholder} />
        </Field>
        <Field label={t.role}>
          <TextInput value={value.signatureRole ?? ""} onChange={(e) => patch({ signatureRole: e.target.value || undefined })} placeholder={t.rolePlaceholder} />
        </Field>
      </div>
      <Optional
        label={f.backgroundImage}
        present={value.backgroundImage !== undefined}
        onToggle={(on) => patch({ backgroundImage: on ? { src: "" } : undefined })}
      >
        {value.backgroundImage ? (
          <ImageRefField label={f.backgroundImage} value={value.backgroundImage} onChange={(v) => patch({ backgroundImage: v })} />
        ) : null}
      </Optional>
    </div>
  );
}
