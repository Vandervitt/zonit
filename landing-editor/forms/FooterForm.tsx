"use client";
// landing-editor/forms/FooterForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import { useEffect, useState } from "react";
import type { FooterSection } from "@/types/schema.draft";
import { ApiRoutes, Routes } from "@/lib/constants";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { Select } from "../ui/Select";

/** 账号级经营主体（只取选用所需字段，完整定义见 lib/company-profiles/db.ts）。 */
interface ProfileOption {
  id: string;
  label: string;
  is_default: boolean;
}

export function FooterForm({ value, onChange }: { value: FooterSection; onChange: (v: FooterSection) => void }) {
  const t = useAdminT().editor.forms.footer;
  const patch = (p: Partial<FooterSection>) => onChange({ ...value, ...p });

  // 主体信息是账号级的，编辑器只负责「这张页用哪一份」。null = 仍在加载：
  // 与「账号确实没有主体信息」区分，否则会闪现一句误导的「还没有主体信息」。
  const [profiles, setProfiles] = useState<ProfileOption[] | null>(null);
  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(ApiRoutes.CompanyProfiles);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setProfiles(await res.json());
      } catch {
        setProfiles([]);
      }
    })();
  }, []);

  return (
    <div className="space-y-3">
      <Field label={t.brandName}>
        <TextInput value={value.brandName} onChange={(e) => patch({ brandName: e.target.value })} />
      </Field>
      <Field label={t.copyrightYear}>
        <TextInput value={value.copyrightYear} onChange={(e) => patch({ copyrightYear: e.target.value })} placeholder="2026" />
      </Field>
      {/* 联系邮箱已并入页面级 contact.email，页脚不再单独存一份 */}
      <Field
        label={t.companyProfile}
        hint={t.companyProfileHint}
      >
        <Select
          value={value.companyProfileId ?? ""}
          onChange={(e) => patch({ companyProfileId: e.target.value || undefined })}
        >
          <option value="">{t.none}</option>
          {(profiles ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.label}{p.is_default ? t.defaultSuffix : ""}</option>
          ))}
        </Select>
      </Field>
      {profiles !== null && profiles.length === 0 && (
        <p className="text-[11px] text-ink-muted">
          {t.noProfile[0]}
          <a href={Routes.Settings} target="_blank" rel="noreferrer" className="underline">{t.settingsLink}</a>
          {t.noProfile[1]}
        </p>
      )}
      <Field label={t.privacy} hint={t.privacyHint}>
        <TextArea rows={4} value={value.privacyPolicy} onChange={(e) => patch({ privacyPolicy: e.target.value })} />
      </Field>
      <Field label={t.terms} hint={t.termsHint}>
        <TextArea rows={4} value={value.termsOfService} onChange={(e) => patch({ termsOfService: e.target.value })} />
      </Field>
    </div>
  );
}
