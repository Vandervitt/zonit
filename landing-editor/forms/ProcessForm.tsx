"use client";
// landing-editor/forms/ProcessForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { ProcessSection, ProcessStep } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";
import { createProcessStep } from "../store/defaults";

export function ProcessForm({ value, onChange }: { value: ProcessSection; onChange: (v: ProcessSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.process;
  const f = d.fields;
  const patch = (p: Partial<ProcessSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<ProcessStep>
        label={t.items}
        addLabel={t.add}
        items={value.steps}
        onChange={(steps) => patch({ steps })}
        create={createProcessStep}
        renderItem={(item, set) => (
          <>
            <Field label={t.title}>
              <TextInput value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
            </Field>
            <Field label={t.desc}>
              <TextArea value={item.description} onChange={(e) => set({ ...item, description: e.target.value })} />
            </Field>
            <Optional
              label={t.image}
              present={item.image !== undefined}
              onToggle={(on) => set({ ...item, image: on ? { src: "" } : undefined })}
            >
              {item.image ? <ImageRefField label={t.image} value={item.image} onChange={(v) => set({ ...item, image: v })} /> : null}
            </Optional>
          </>
        )}
      />
    </div>
  );
}
