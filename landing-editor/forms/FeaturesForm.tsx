"use client";
// landing-editor/forms/FeaturesForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { FeaturesSection, FeatureItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { EmojiInput } from "../ui/EmojiInput";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields } from "./fields";
import { createFeatureItem } from "../store/defaults";

export function FeaturesForm({ value, onChange }: { value: FeaturesSection; onChange: (v: FeaturesSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.features;
  const f = d.fields;
  const patch = (p: Partial<FeaturesSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<FeatureItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createFeatureItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <Field label={f.icon}>
                <EmojiInput value={item.icon ?? ""} onChange={(icon) => set({ ...item, icon: icon || undefined })} placeholder="✨" />
              </Field>
              <Field label={t.title}>
                <TextInput value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
              </Field>
            </div>
            <Field label={f.description}>
              <TextArea value={item.description} onChange={(e) => set({ ...item, description: e.target.value })} />
            </Field>
          </>
        )}
      />
    </div>
  );
}
