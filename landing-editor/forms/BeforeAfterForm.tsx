"use client";
// landing-editor/forms/BeforeAfterForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { BeforeAfterSection, BeforeAfterItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField } from "./fields";
import { createBeforeAfterItem } from "../store/defaults";

export function BeforeAfterForm({ value, onChange }: { value: BeforeAfterSection; onChange: (v: BeforeAfterSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.beforeAfter;
  const f = d.fields;
  const patch = (p: Partial<BeforeAfterSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label={t.disclaimer}>
        <TextArea value={value.disclaimer ?? ""} onChange={(e) => patch({ disclaimer: e.target.value || undefined })} placeholder={t.disclaimerPlaceholder} />
      </Field>
      <RepeatableList<BeforeAfterItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createBeforeAfterItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.customer}>
                <TextInput value={item.crmName} onChange={(e) => set({ ...item, crmName: e.target.value })} />
              </Field>
              <Field label={t.duration}>
                <TextInput value={item.duration} onChange={(e) => set({ ...item, duration: e.target.value })} placeholder={t.durationPlaceholder} />
              </Field>
            </div>
            <Field label={t.caseDesc}>
              <TextArea value={item.caseDescription} onChange={(e) => set({ ...item, caseDescription: e.target.value })} />
            </Field>
            <ImageRefField label={t.before} value={item.beforeImage} onChange={(v) => set({ ...item, beforeImage: v })} />
            <ImageRefField label={t.after} value={item.afterImage} onChange={(v) => set({ ...item, afterImage: v })} />
          </>
        )}
      />
    </div>
  );
}
