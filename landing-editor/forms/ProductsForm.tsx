"use client";
// landing-editor/forms/ProductsForm.tsx
import type { ProductsSection, ProductItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";
import { createProductItem } from "../store/defaults";

export function ProductsForm({ value, onChange }: { value: ProductsSection; onChange: (v: ProductsSection) => void }) {
  const patch = (p: Partial<ProductsSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<ProductItem>
        label="产品项"
        addLabel="添加产品"
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createProductItem}
        renderItem={(item, set) => (
          <>
            <Field label="名称">
              <TextInput value={item.name} onChange={(e) => set({ ...item, name: e.target.value })} />
            </Field>
            <Field label="描述">
              <TextArea value={item.description} onChange={(e) => set({ ...item, description: e.target.value })} />
            </Field>
            <Optional
              label="背景图"
              present={item.backgroundImage !== undefined}
              onToggle={(on) => set({ ...item, backgroundImage: on ? { src: "" } : undefined })}
            >
              {item.backgroundImage ? (
                <ImageRefField label="背景图" value={item.backgroundImage} onChange={(v) => set({ ...item, backgroundImage: v })} />
              ) : null}
            </Optional>
          </>
        )}
      />
    </div>
  );
}
