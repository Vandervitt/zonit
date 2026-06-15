"use client";
// landing-editor/forms/FooterForm.tsx
import type { FooterSection } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { validateEmail } from "../lib/validate";

export function FooterForm({ value, onChange }: { value: FooterSection; onChange: (v: FooterSection) => void }) {
  const patch = (p: Partial<FooterSection>) => onChange({ ...value, ...p });

  return (
    <div className="space-y-3">
      <Field label="品牌名称">
        <TextInput value={value.brandName} onChange={(e) => patch({ brandName: e.target.value })} />
      </Field>
      <Field label="版权年份">
        <TextInput value={value.copyrightYear} onChange={(e) => patch({ copyrightYear: e.target.value })} placeholder="2026" />
      </Field>
      <Field label="联系邮箱" error={validateEmail(value.contactEmail)}>
        <TextInput
          type="email"
          value={value.contactEmail}
          onChange={(e) => patch({ contactEmail: e.target.value })}
          placeholder="contact@example.com"
        />
      </Field>
      <Field label="隐私政策">
        <TextArea rows={4} value={value.privacyPolicy} onChange={(e) => patch({ privacyPolicy: e.target.value })} />
      </Field>
      <Field label="服务条款">
        <TextArea rows={4} value={value.termsOfService} onChange={(e) => patch({ termsOfService: e.target.value })} />
      </Field>
    </div>
  );
}
