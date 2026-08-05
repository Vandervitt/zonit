"use client";
// landing-editor/forms/StatsForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { StatsSection, StatItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { EmojiInput } from "../ui/EmojiInput";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";
import { createStatItem } from "../store/defaults";

export function StatsForm({ value, onChange }: { value: StatsSection; onChange: (v: StatsSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.stats;
  const f = d.fields;
  const patch = (p: Partial<StatsSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<StatItem>
        label={t.items}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createStatItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.value}>
                <TextInput value={item.value} onChange={(e) => set({ ...item, value: e.target.value })} placeholder="10k+" />
              </Field>
              <Field label={f.label}>
                <TextInput value={item.label} onChange={(e) => set({ ...item, label: e.target.value })} placeholder={t.labelPlaceholder} />
              </Field>
            </div>
            <Field label={f.icon}>
              <EmojiInput value={item.icon ?? ""} onChange={(icon) => set({ ...item, icon: icon || undefined })} placeholder="⭐" />
            </Field>
            <Optional
              label={f.backgroundImage}
              present={item.backgroundImage !== undefined}
              onToggle={(on) => set({ ...item, backgroundImage: on ? { src: "" } : undefined })}
            >
              {item.backgroundImage ? (
                <ImageRefField label={f.backgroundImage} value={item.backgroundImage} onChange={(v) => set({ ...item, backgroundImage: v })} />
              ) : null}
            </Optional>
          </>
        )}
      />
    </div>
  );
}
