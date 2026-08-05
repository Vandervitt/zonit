"use client";
// landing-editor/forms/LeadFormForm.tsx
// 留资表单页面级配置面板。固定字段集，各字段开关 + 必填 + 前台标签。
// 左侧中文是后台的字段名（给运营看），label 输入框填的是访客在落地页上看到的文案。
import { useAdminT } from "@/lib/i18n/admin/context";
import type { LeadForm, LeadFormFieldConfig } from "@/types/schema.draft";
import { LEAD_CONTACT_FIELDS } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";

/** 访客在落地页上看到的缺省标签，与渲染器保持一致，仅用于输入框占位提示。 */
const FRONT_LABEL_DEFAULTS: Record<string, string> = {
  name: "Name",
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  telegram: "Telegram",
  message: "Message",
};
const FIELD_ORDER = ["name", "email", "phone", "whatsapp", "telegram", "message"] as const;

export function LeadFormForm({ value, onChange }: { value: LeadForm; onChange: (v: LeadForm) => void }) {
  const t = useAdminT().editor.forms.leadForm;
  /** 编辑器里各字段行的显示名（不是访客看到的标签，那个见 FRONT_LABEL_DEFAULTS）。 */
  const fieldLabels: Record<string, string> = {
    name: t.name,
    email: t.email,
    phone: t.phone,
    whatsapp: "WhatsApp",
    telegram: "Telegram",
    message: t.message,
  };
  const patch = (p: Partial<LeadForm>) => onChange({ ...value, ...p });
  const patchField = (k: (typeof FIELD_ORDER)[number], p: Partial<LeadFormFieldConfig>) =>
    onChange({ ...value, fields: { ...value.fields, [k]: { ...value.fields[k], ...p } } });

  const hasContact = LEAD_CONTACT_FIELDS.some((f) => value.fields[f].enabled);

  return (
    <div className="space-y-3">
      <Field label={t.title}>
        <TextInput value={value.title} onChange={(e) => patch({ title: e.target.value })} placeholder={t.titlePlaceholder} />
      </Field>
      <Field label={t.desc}>
        <TextInput value={value.description ?? ""} onChange={(e) => patch({ description: e.target.value })} />
      </Field>
      <Field label={t.submitText}>
        <TextInput value={value.submitText} onChange={(e) => patch({ submitText: e.target.value })} placeholder={t.submitPlaceholder} />
      </Field>
      <Field label={t.successText}>
        <TextInput value={value.successMessage} onChange={(e) => patch({ successMessage: e.target.value })} />
      </Field>

      <div className="rounded-lg border border-edge p-2.5">
        <div className="mb-2 text-xs font-medium text-ink-soft">{t.fields}</div>
        <div className="space-y-1.5">
          {FIELD_ORDER.map((k) => (
            <div key={k} className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-sm">
                <span className="text-ink">{fieldLabels[k]}</span>
                <div className="flex items-center gap-3 text-xs text-ink-soft">
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={value.fields[k].enabled}
                      onChange={(e) => patchField(k, { enabled: e.target.checked })}
                    />
                    {t.enable}
                  </label>
                  <label className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={value.fields[k].required}
                      disabled={!value.fields[k].enabled}
                      onChange={(e) => patchField(k, { required: e.target.checked })}
                    />
                    {t.required}
                  </label>
                </div>
              </div>
              {value.fields[k].enabled ? (
                <TextInput
                  value={value.fields[k].label ?? ""}
                  onChange={(e) => patchField(k, { label: e.target.value })}
                  placeholder={t.frontLabelPlaceholder(FRONT_LABEL_DEFAULTS[k])}
                />
              ) : null}
            </div>
          ))}
        </div>
        {!hasContact ? (
          <p className="mt-2 text-xs text-red-600">{t.fieldsHint}</p>
        ) : null}
      </div>
    </div>
  );
}
