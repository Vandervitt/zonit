"use client";
// landing-editor/forms/FaqForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { FaqSection, FaqItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { IconHeadingField } from "./fields";
import { createFaqItem } from "../store/defaults";

export function FaqForm({ value, onChange }: { value: FaqSection; onChange: (v: FaqSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.faq;
  const f = d.fields;
  const patch = (p: Partial<FaqSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <IconHeadingField value={value.title} onChange={(v) => patch({ title: v })} />
      <Field label={f.subtitle}>
        <TextInput value={value.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value || undefined })} />
      </Field>
      <RepeatableList<FaqItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createFaqItem}
        renderItem={(item, set) => (
          <>
            <Field label={t.question}>
              <TextInput value={item.question} onChange={(e) => set({ ...item, question: e.target.value })} />
            </Field>
            <Field label={t.answer}>
              <TextArea value={item.answer} onChange={(e) => set({ ...item, answer: e.target.value })} />
            </Field>
          </>
        )}
      />
    </div>
  );
}
