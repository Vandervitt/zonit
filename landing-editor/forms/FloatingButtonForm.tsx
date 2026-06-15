"use client";
// landing-editor/forms/FloatingButtonForm.tsx
import type { FloatingButton } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { validateLink } from "../lib/validate";

export function FloatingButtonForm({ value, onChange }: { value: FloatingButton; onChange: (v: FloatingButton) => void }) {
  const patch = (p: Partial<FloatingButton>) => onChange({ ...value, ...p });

  return (
    <div className="space-y-3">
      <Field label="按钮文案">
        <TextInput value={value.text} onChange={(e) => patch({ text: e.target.value })} placeholder="立即咨询" />
      </Field>
      <Field label="按钮链接" error={validateLink(value.link)}>
        <TextInput value={value.link} onChange={(e) => patch({ link: e.target.value })} placeholder="https://… / tel: / mailto:" />
      </Field>
    </div>
  );
}
