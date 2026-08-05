"use client";
// landing-editor/forms/CountdownForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { CountdownSection } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { IconHeadingField } from "./fields";

export function CountdownForm({ value, onChange }: { value: CountdownSection; onChange: (v: CountdownSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.countdown;
  const f = d.fields;
  const patch = (p: Partial<CountdownSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <IconHeadingField value={value.title} onChange={(v) => patch({ title: v })} />
      <Field label={f.subtitle}>
        <TextInput value={value.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value || undefined })} />
      </Field>
      <Field label={t.deadline} hint={t.deadlinePlaceholder}>
        <TextInput value={value.endsAt} onChange={(e) => patch({ endsAt: e.target.value })} placeholder="2026-12-31T23:59:59+08:00" />
      </Field>
    </div>
  );
}
