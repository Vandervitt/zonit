"use client";
// landing-editor/forms/PlansForm.tsx
// 套餐：name / desc / badge / label（展示文案，非价格）/ 价值点 / 倒计时 / CTA。
import type { PlansSection, PlanItem } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, CtaButtonField, Optional } from "./fields";
import { createPlanItem } from "../store/defaults";

export function PlansForm({ value, onChange }: { value: PlansSection; onChange: (v: PlansSection) => void }) {
  const patch = (p: Partial<PlansSection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<PlanItem>
        label="套餐项"
        addLabel="添加套餐"
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createPlanItem}
        renderItem={(item, set) => (
          <>
            <Field label="名称">
              <TextInput value={item.name} onChange={(e) => set({ ...item, name: e.target.value })} />
            </Field>
            <Field label="描述">
              <TextArea value={item.description} onChange={(e) => set({ ...item, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Field label="角标 Badge">
                <TextInput value={item.badge ?? ""} onChange={(e) => set({ ...item, badge: e.target.value || undefined })} placeholder="推荐" />
              </Field>
              <Field label="标签文案">
                <TextInput value={item.label ?? ""} onChange={(e) => set({ ...item, label: e.target.value || undefined })} placeholder="非价格展示文案" />
              </Field>
            </div>
            <RepeatableList<string>
              label="价值点"
              addLabel="添加价值点"
              items={item.valueProps}
              onChange={(valueProps) => set({ ...item, valueProps })}
              create={() => ""}
              renderItem={(line, setLine) => <TextInput value={line} onChange={(e) => setLine(e.target.value)} />}
            />
            <Optional
              label="倒计时"
              present={item.countdown !== undefined}
              onToggle={(on) => set({ ...item, countdown: on ? { endsAt: "" } : undefined })}
            >
              {item.countdown ? (
                <Field label="截止时间（带时区 ISO）">
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
