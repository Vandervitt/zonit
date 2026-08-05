"use client";
// landing-editor/forms/GuaranteeForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { GuaranteeSection, GuaranteeItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { EmojiInput } from "../ui/EmojiInput";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields } from "./fields";
import { createGuaranteeItem } from "../store/defaults";

export function GuaranteeForm({ value, onChange }: { value: GuaranteeSection; onChange: (v: GuaranteeSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.guarantee;
  const f = d.fields;
  const patch = (p: Partial<GuaranteeSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label={f.description}>
        <TextArea value={value.description ?? ""} onChange={(e) => patch({ description: e.target.value || undefined })} />
      </Field>
      <RepeatableList<GuaranteeItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createGuaranteeItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <Field label={f.icon}>
                <EmojiInput value={item.icon ?? ""} onChange={(icon) => set({ ...item, icon: icon || undefined })} placeholder="🔒" />
              </Field>
              <Field label={f.title}>
                <TextInput value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
              </Field>
            </div>
            <Field label={f.subtitle}>
              <TextInput value={item.subtitle ?? ""} onChange={(e) => set({ ...item, subtitle: e.target.value || undefined })} />
            </Field>
          </>
        )}
      />
    </div>
  );
}
