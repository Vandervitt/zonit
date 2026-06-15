"use client";
// landing-editor/forms/StoryForm.tsx
import type { StorySection } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";

export function StoryForm({ value, onChange }: { value: StorySection; onChange: (v: StorySection) => void }) {
  const patch = (p: Partial<StorySection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label="正文段落">
        <TextArea rows={5} value={value.body} onChange={(e) => patch({ body: e.target.value })} />
      </Field>
      <div className="grid grid-cols-2 gap-2">
        <Field label="署名">
          <TextInput value={value.signatureName ?? ""} onChange={(e) => patch({ signatureName: e.target.value || undefined })} placeholder="张三" />
        </Field>
        <Field label="职位">
          <TextInput value={value.signatureRole ?? ""} onChange={(e) => patch({ signatureRole: e.target.value || undefined })} placeholder="创始人" />
        </Field>
      </div>
      <Optional
        label="背景图"
        present={value.backgroundImage !== undefined}
        onToggle={(on) => patch({ backgroundImage: on ? { src: "" } : undefined })}
      >
        {value.backgroundImage ? (
          <ImageRefField label="背景图" value={value.backgroundImage} onChange={(v) => patch({ backgroundImage: v })} />
        ) : null}
      </Optional>
    </div>
  );
}
