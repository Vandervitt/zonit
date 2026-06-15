"use client";
// landing-editor/forms/CountdownForm.tsx
import type { CountdownSection } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { IconHeadingField } from "./fields";

export function CountdownForm({ value, onChange }: { value: CountdownSection; onChange: (v: CountdownSection) => void }) {
  const patch = (p: Partial<CountdownSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <IconHeadingField value={value.title} onChange={(v) => patch({ title: v })} />
      <Field label="副标题">
        <TextInput value={value.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value || undefined })} />
      </Field>
      <Field label="截止时间（带时区 ISO）" hint="例：2026-12-31T23:59:59+08:00">
        <TextInput value={value.endsAt} onChange={(e) => patch({ endsAt: e.target.value })} placeholder="2026-12-31T23:59:59+08:00" />
      </Field>
    </div>
  );
}
