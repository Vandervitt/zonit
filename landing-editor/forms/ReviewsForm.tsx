"use client";
// landing-editor/forms/ReviewsForm.tsx
import type { ReviewsSection, ReviewItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";
import { createReviewItem } from "../store/defaults";

export function ReviewsForm({ value, onChange }: { value: ReviewsSection; onChange: (v: ReviewsSection) => void }) {
  const patch = (p: Partial<ReviewsSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <Field label="描述">
        <TextArea value={value.description ?? ""} onChange={(e) => patch({ description: e.target.value || undefined })} />
      </Field>
      <RepeatableList<ReviewItem>
        label="评价项"
        addLabel="添加评价"
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createReviewItem}
        renderItem={(item, set) => (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="姓名">
                <TextInput value={item.name} onChange={(e) => set({ ...item, name: e.target.value })} />
              </Field>
              <Field label="地区">
                <TextInput value={item.location ?? ""} onChange={(e) => set({ ...item, location: e.target.value || undefined })} placeholder="US" />
              </Field>
            </div>
            <Field label="渠道">
              <TextInput value={item.channel ?? ""} onChange={(e) => set({ ...item, channel: e.target.value || undefined })} placeholder="WhatsApp / Trustpilot" />
            </Field>
            <Field label="评价内容">
              <TextArea value={item.content.text} onChange={(e) => set({ ...item, content: { ...item.content, text: e.target.value } })} />
            </Field>
            <Optional
              label="头像"
              present={item.avatar !== undefined}
              onToggle={(on) => set({ ...item, avatar: on ? { src: "" } : undefined })}
            >
              {item.avatar ? <ImageRefField label="头像" value={item.avatar} onChange={(v) => set({ ...item, avatar: v })} /> : null}
            </Optional>
            <Optional
              label="评价配图"
              present={item.content.image !== undefined}
              onToggle={(on) => set({ ...item, content: { ...item.content, image: on ? { src: "" } : undefined } })}
            >
              {item.content.image ? (
                <ImageRefField
                  label="配图"
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
