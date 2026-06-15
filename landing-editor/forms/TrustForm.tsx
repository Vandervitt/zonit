"use client";
// landing-editor/forms/TrustForm.tsx
import type { TrustSection, TrustBadgeItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { EmojiInput } from "../ui/EmojiInput";
import { RepeatableList } from "../ui/RepeatableList";
import { ImageRefField, Optional } from "./fields";
import { createTrustBadge } from "../store/defaults";

export function TrustForm({ value, onChange }: { value: TrustSection; onChange: (v: TrustSection) => void }) {
  const patch = (p: Partial<TrustSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <Optional
        label="背景图"
        present={value.backgroundImage !== undefined}
        onToggle={(on) => patch({ backgroundImage: on ? { src: "" } : undefined })}
      >
        {value.backgroundImage ? (
          <ImageRefField label="背景图" value={value.backgroundImage} onChange={(v) => patch({ backgroundImage: v })} />
        ) : null}
      </Optional>
      <RepeatableList<TrustBadgeItem>
        label="信任徽章"
        addLabel="添加徽章"
        items={value.badges}
        onChange={(badges) => patch({ badges })}
        create={createTrustBadge}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-[7rem_1fr] gap-2">
              <Field label="图标">
                <EmojiInput value={item.icon ?? ""} onChange={(icon) => set({ ...item, icon: icon || undefined })} placeholder="🛡️" />
              </Field>
              <Field label="主文案">
                <TextInput value={item.title} onChange={(e) => set({ ...item, title: e.target.value })} />
              </Field>
            </div>
            <Field label="副文案">
              <TextInput value={item.subtitle ?? ""} onChange={(e) => set({ ...item, subtitle: e.target.value || undefined })} />
            </Field>
          </>
        )}
      />
    </div>
  );
}
