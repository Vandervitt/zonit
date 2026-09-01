"use client";
// landing-editor/forms/LogoWallForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { LogoWallSection, LogoItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField } from "./fields";
import { createLogoItem } from "../store/defaults";

export function LogoWallForm({ value, onChange }: { value: LogoWallSection; onChange: (v: LogoWallSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.logoWall;
  const patch = (p: Partial<LogoWallSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<LogoItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createLogoItem}
        renderItem={(item, set) => (
          <>
            <Field label={t.name}>
              <TextInput value={item.name} onChange={(e) => set({ ...item, name: e.target.value })} placeholder={t.namePlaceholder} />
            </Field>
            <ImageRefField value={item.image} onChange={(image) => set({ ...item, image })} />
          </>
        )}
      />
    </div>
  );
}
