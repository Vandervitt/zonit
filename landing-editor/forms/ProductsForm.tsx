"use client";
// landing-editor/forms/ProductsForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { ProductsSection, ProductItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, Optional } from "./fields";
import { createProductItem } from "../store/defaults";

export function ProductsForm({ value, onChange }: { value: ProductsSection; onChange: (v: ProductsSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.products;
  const f = d.fields;
  const patch = (p: Partial<ProductsSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<ProductItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createProductItem}
        renderItem={(item, set) => (
          <>
            <Field label={f.name}>
              <TextInput value={item.name} onChange={(e) => set({ ...item, name: e.target.value })} />
            </Field>
            <Field label={f.description}>
              <TextArea value={item.description} onChange={(e) => set({ ...item, description: e.target.value })} />
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
