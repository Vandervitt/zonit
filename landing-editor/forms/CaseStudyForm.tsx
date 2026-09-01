"use client";
// landing-editor/forms/CaseStudyForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { CaseStudySection, CaseStudyItem, ImageRef } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { RepeatableList } from "../ui/RepeatableList";
import { TitleSubtitleFields, ImageRefField, CtaButtonField, Optional } from "./fields";
import { createCaseStudyItem, createSectionCta } from "../store/defaults";

export function CaseStudyForm({ value, onChange }: { value: CaseStudySection; onChange: (v: CaseStudySection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.caseStudy;
  const f = d.fields;
  const patch = (p: Partial<CaseStudySection>) => onChange({ ...value, ...p });
  return (
    <div className="space-y-3">
      <TitleSubtitleFields value={value} patch={patch} />
      <RepeatableList<CaseStudyItem>
        label={t.items}
        addLabel={t.add}
        items={value.items}
        onChange={(items) => patch({ items })}
        create={createCaseStudyItem}
        renderItem={(item, set) => (
          <>
            <Field label={t.client}>
              <TextInput value={item.client} onChange={(e) => set({ ...item, client: e.target.value })} placeholder={t.clientPlaceholder} />
            </Field>
            <Field label={t.summary}>
              <TextInput value={item.summary} onChange={(e) => set({ ...item, summary: e.target.value })} placeholder={t.summaryPlaceholder} />
            </Field>
            <Field label={f.description}>
              <TextArea value={item.detail ?? ""} onChange={(e) => set({ ...item, detail: e.target.value || undefined })} />
            </Field>
            {/* 指标是两个自由字符串，平台不做任何计算——一旦我们替用户算出
                「提升 300%」，那个数字的举证责任就落到平台头上。 */}
            <div className="grid grid-cols-2 gap-2">
              <Field label={t.metricValue}>
                <TextInput
                  value={item.metricValue ?? ""}
                  onChange={(e) => set({ ...item, metricValue: e.target.value || undefined })}
                  placeholder={t.metricValuePlaceholder}
                />
              </Field>
              <Field label={t.metricLabel}>
                <TextInput
                  value={item.metricLabel ?? ""}
                  onChange={(e) => set({ ...item, metricLabel: e.target.value || undefined })}
                  placeholder={t.metricLabelPlaceholder}
                />
              </Field>
            </div>
            <p className="text-xs text-slate-500">{t.metricHint}</p>
            <ImageRefField
              value={item.image ?? ({ src: "" } as ImageRef)}
              onChange={(image) => set({ ...item, image: image.src ? image : undefined })}
            />
          </>
        )}
      />
      <Optional
        label={d.fieldKit.sectionCta}
        present={!!value.cta}
        onToggle={(on) => patch({ cta: on ? createSectionCta() : undefined })}
      >
        <p className="text-xs text-slate-500">{d.fieldKit.sectionCtaHint}</p>
        {value.cta && <CtaButtonField value={value.cta} onChange={(cta) => patch({ cta })} />}
      </Optional>
    </div>
  );
}
