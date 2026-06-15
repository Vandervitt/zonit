"use client";
// landing-editor/forms/GuaranteeForm.tsx
import type { GuaranteeSection, GuaranteeItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { EmojiInput } from "../ui/EmojiInput";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields } from "./fields";
import { createGuaranteeItem } from "../store/defaults";

export function GuaranteeForm({ value, onChange }: { value: GuaranteeSection; onChange: (v: GuaranteeSection) => void }) {
  const patch = (p: Partial<GuaranteeSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label="描述">
        <TextArea value={value.description ?? ""} onChange={(e) => patch({ description: e.target.value || undefined })} />
      </Field>
      <RepeatableList<GuaranteeItem>
        label="保障项"
        addLabel="添加保障"
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createGuaranteeItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <Field label="图标">
                <EmojiInput value={item.icon ?? ""} onChange={(icon) => set({ ...item, icon: icon || undefined })} placeholder="🔒" />
              </Field>
              <Field label="主标题">
                <TextInput value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
              </Field>
            </div>
            <Field label="副标题">
              <TextInput value={item.subtitle ?? ""} onChange={(e) => set({ ...item, subtitle: e.target.value || undefined })} />
            </Field>
          </>
        )}
      />
    </div>
  );
}
