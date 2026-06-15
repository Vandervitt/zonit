"use client";
// landing-editor/forms/BeforeAfterForm.tsx
import type { BeforeAfterSection, BeforeAfterItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField } from "./fields";
import { createBeforeAfterItem } from "../store/defaults";

export function BeforeAfterForm({ value, onChange }: { value: BeforeAfterSection; onChange: (v: BeforeAfterSection) => void }) {
  const patch = (p: Partial<BeforeAfterSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label="免责声明">
        <TextArea value={value.disclaimer ?? ""} onChange={(e) => patch({ disclaimer: e.target.value || undefined })} placeholder="如：效果因人而异" />
      </Field>
      <RepeatableList<BeforeAfterItem>
        label="对比项"
        addLabel="添加对比"
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createBeforeAfterItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="客户 / 来源">
                <TextInput value={item.crmName} onChange={(e) => set({ ...item, crmName: e.target.value })} />
              </Field>
              <Field label="使用时长">
                <TextInput value={item.duration} onChange={(e) => set({ ...item, duration: e.target.value })} placeholder="4 周" />
              </Field>
            </div>
            <Field label="案例描述">
              <TextArea value={item.caseDescription} onChange={(e) => set({ ...item, caseDescription: e.target.value })} />
            </Field>
            <ImageRefField label="使用前 Before" value={item.beforeImage} onChange={(v) => set({ ...item, beforeImage: v })} />
            <ImageRefField label="使用后 After" value={item.afterImage} onChange={(v) => set({ ...item, afterImage: v })} />
          </>
        )}
      />
    </div>
  );
}
