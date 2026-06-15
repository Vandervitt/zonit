"use client";
// landing-editor/forms/FaqForm.tsx
import type { FaqSection, FaqItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { IconHeadingField } from "./fields";
import { createFaqItem } from "../store/defaults";

export function FaqForm({ value, onChange }: { value: FaqSection; onChange: (v: FaqSection) => void }) {
  const patch = (p: Partial<FaqSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <IconHeadingField value={value.title} onChange={(v) => patch({ title: v })} />
      <Field label="副标题">
        <TextInput value={value.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value || undefined })} />
      </Field>
      <RepeatableList<FaqItem>
        label="问答"
        addLabel="添加问答"
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createFaqItem}
        renderItem={(item, set) => (
          <>
            <Field label="问题">
              <TextInput value={item.question} onChange={(e) => set({ ...item, question: e.target.value })} />
            </Field>
            <Field label="回答">
              <TextArea value={item.answer} onChange={(e) => set({ ...item, answer: e.target.value })} />
            </Field>
          </>
        )}
      />
    </div>
  );
}
