"use client";
// landing-editor/forms/LeadFormForm.tsx
// 留资表单页面级配置面板。固定字段集，各字段开关 + 必填。
import type { LeadForm, LeadFormFieldConfig } from "@/types/schema.draft";
import { LEAD_CONTACT_FIELDS } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";

const FIELD_LABELS: Record<string, string> = {
  name: "姓名",
  email: "邮箱",
  phone: "电话",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  message: "留言",
};
const FIELD_ORDER = ["name", "email", "phone", "whatsapp", "telegram", "message"] as const;

export function LeadFormForm({ value, onChange }: { value: LeadForm; onChange: (v: LeadForm) => void }) {
  const patch = (p: Partial<LeadForm>) => onChange({ ...value, ...p });
  const patchField = (k: (typeof FIELD_ORDER)[number], p: Partial<LeadFormFieldConfig>) =>
    onChange({ ...value, fields: { ...value.fields, [k]: { ...value.fields[k], ...p } } });

  const hasContact = LEAD_CONTACT_FIELDS.some((f) => value.fields[f].enabled);

  return (
    <div className="space-y-3">
      <Field label="表单标题">
        <TextInput value={value.title} onChange={(e) => patch({ title: e.target.value })} placeholder="留下联系方式" />
      </Field>
      <Field label="描述（选填）">
        <TextInput value={value.description ?? ""} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
      <Field label="提交按钮文案">
        <TextInput value={value.submitText} onChange={(e) => patch({ submitText: e.target.value })} placeholder="提交" />
      </Field>
      <Field label="成功提示">
        <TextInput value={value.successMessage} onChange={(e) => patch({ successMessage: e.target.value })} />
      </Field>

      <div className="rounded-lg border border-edge p-2.5">
        <div className="mb-2 text-xs font-medium text-ink-soft">字段（至少启用一个联系方式）</div>
        <div className="space-y-1.5">
          {FIELD_ORDER.map((k) => (
            <div key={k} className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink">{FIELD_LABELS[k]}</span>
              <div className="flex items-center gap-3 text-xs text-ink-soft">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={value.fields[k].enabled}
                    onChange={(e) => patchField(k, { enabled: e.target.checked })}
                  />
                  启用
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={value.fields[k].required}
                    disabled={!value.fields[k].enabled}
                    onChange={(e) => patchField(k, { required: e.target.checked })}
                  />
                  必填
                </label>
              </div>
            </div>
          ))}
        </div>
        {!hasContact ? (
          <p className="mt-2 text-xs text-red-600">建议至少启用一个联系方式（邮箱/电话/WhatsApp/Telegram）</p>
        ) : null}
      </div>
    </div>
  );
}
