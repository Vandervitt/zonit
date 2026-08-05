"use client";
// landing-editor/forms/PlansForm.tsx
// 套餐：name / desc / badge / label（展示文案，非价格）/ 价值点 / 倒计时 / CTA。
import { useAdminT } from "@/lib/i18n/admin/context";
import type { PlansSection, PlanItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, CtaButtonField, Optional } from "./fields";
import { createPlanItem } from "../store/defaults";

export function PlansForm({ value, onChange }: { value: PlansSection; onChange: (v: PlansSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.plans;
  const f = d.fields;
  const cd = d.forms.countdown;
  const patch = (p: Partial<PlansSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<PlanItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createPlanItem}
        renderItem={(item, set) => (
          <>
            <Field label={f.name}>
              <TextInput value={item.name} onChange={(e) => set({ ...item, name: e.target.value })} />
            </Field>
            <Field label={f.description}>
              <TextArea value={item.description} onChange={(e) => set({ ...item, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.badge}>
                <TextInput value={item.badge ?? ""} onChange={(e) => set({ ...item, badge: e.target.value || undefined })} placeholder={t.badgePlaceholder} />
              </Field>
              <Field label={f.badgeText}>
                <TextInput value={item.label ?? ""} onChange={(e) => set({ ...item, label: e.target.value || undefined })} placeholder={t.nonPriceText} />
              </Field>
            </div>
            <RepeatableList<string>
              label={t.benefits}
              addLabel={t.addBenefit}
              items={item.valueProps}
              onChange={(valueProps) => set({ ...item, valueProps })}
              create={() => ""}
              renderItem={(line, setLine) => <TextInput value={line} onChange={(e) => setLine(e.target.value)} />}
            />
            <Optional
              label={cd.title}
              present={item.countdown !== undefined}
              onToggle={(on) => set({ ...item, countdown: on ? { endsAt: "" } : undefined })}
            >
              {item.countdown ? (
                <Field label={t.deadline}>
                  <TextInput
                    value={item.countdown.endsAt}
                    onChange={(e) => set({ ...item, countdown: { endsAt: e.target.value } })}
                    placeholder="2026-12-31T23:59:59+08:00"
                  />
                </Field>
              ) : null}
            </Optional>
            <CtaButtonField value={item.cta} onChange={(v) => set({ ...item, cta: v })} />
          </>
        )}
      />
    </div>
  );
}
