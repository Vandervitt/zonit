"use client";
// landing-editor/forms/ReviewsForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { ReviewsSection, ReviewItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";
import { createReviewItem } from "../store/defaults";

export function ReviewsForm({ value, onChange }: { value: ReviewsSection; onChange: (v: ReviewsSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.reviews;
  const f = d.fields;
  const patch = (p: Partial<ReviewsSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label={f.description}>
        <TextArea value={value.description ?? ""} onChange={(e) => patch({ description: e.target.value || undefined })} />
      </Field>
      <RepeatableList<ReviewItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createReviewItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.name}>
                <TextInput value={item.name} onChange={(e) => set({ ...item, name: e.target.value })} />
              </Field>
              <Field label={t.region}>
                <TextInput value={item.location ?? ""} onChange={(e) => set({ ...item, location: e.target.value || undefined })} placeholder="US" />
              </Field>
            </div>
            <Field label={t.channel}>
              <TextInput value={item.channel ?? ""} onChange={(e) => set({ ...item, channel: e.target.value || undefined })} placeholder="WhatsApp / Trustpilot" />
            </Field>
            <Field label={t.body}>
              <TextArea value={item.content.text} onChange={(e) => set({ ...item, content: { ...item.content, text: e.target.value } })} />
            </Field>
            <Optional
              label={t.avatar}
              present={item.avatar !== undefined}
              onToggle={(on) => set({ ...item, avatar: on ? { src: "" } : undefined })}
            >
              {item.avatar ? <ImageRefField label={t.avatar} value={item.avatar} onChange={(v) => set({ ...item, avatar: v })} /> : null}
            </Optional>
            <Optional
              label={t.image}
              present={item.content.image !== undefined}
              onToggle={(on) => set({ ...item, content: { ...item.content, image: on ? { src: "" } : undefined } })}
            >
              {item.content.image ? (
                <ImageRefField
                  label={t.image}
                  value={item.content.image}
                  onChange={(v) => set({ ...item, content: { ...item.content, image: v } })}
                />
              ) : null}
            </Optional>
          </>
        )}
      />
    </div>
  );
}
