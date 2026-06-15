"use client";
// landing-editor/forms/ProcessForm.tsx
import type { ProcessSection, ProcessStep } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";
import { createProcessStep } from "../store/defaults";

export function ProcessForm({ value, onChange }: { value: ProcessSection; onChange: (v: ProcessSection) => void }) {
  const patch = (p: Partial<ProcessSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<ProcessStep>
        label="步骤"
        addLabel="添加步骤"
        items={value.steps}
        onChange={(steps) => patch({ steps })}
        create={createProcessStep}
        renderItem={(item, set) => (
          <>
            <Field label="步骤标题">
              <TextInput value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
            </Field>
            <Field label="步骤描述">
              <TextArea value={item.description} onChange={(e) => set({ ...item, description: e.target.value })} />
            </Field>
            <Optional
              label="步骤配图"
              present={item.image !== undefined}
              onToggle={(on) => set({ ...item, image: on ? { src: "" } : undefined })}
            >
              {item.image ? <ImageRefField label="配图" value={item.image} onChange={(v) => set({ ...item, image: v })} /> : null}
            </Optional>
          </>
        )}
      />
    </div>
  );
}
