"use client";
// landing-editor/forms/FooterForm.tsx
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
      <Field label="品牌名称">
        <TextInput value={value.brandName} onChange={(e) => patch({ brandName: e.target.value })} />
      </Field>
      <Field label="版权年份">
        <TextInput value={value.copyrightYear} onChange={(e) => patch({ copyrightYear: e.target.value })} placeholder="2026" />
      </Field>
      {/* 联系邮箱已并入页面级 contact.email，页脚不再单独存一份 */}
      <Field
        label="经营主体信息"
        hint="页脚展示的公司信息与执照。TikTok 对电商与金融类页面要求展示，Meta / LinkedIn 也会核对身份真实性。"
      >
        <Select
          value={value.companyProfileId ?? ""}
          onChange={(e) => patch({ companyProfileId: e.target.value || undefined })}
        >
          <option value="">不展示</option>
          {(profiles ?? []).map((p) => (
            <option key={p.id} value={p.id}>{p.label}{p.is_default ? "（默认）" : ""}</option>
          ))}
        </Select>
      </Field>
      {profiles !== null && profiles.length === 0 && (
        <p className="text-[11px] text-ink-muted">
          账号里还没有主体信息。到{" "}
          <a href={Routes.Settings} target="_blank" rel="noreferrer" className="underline">设置 · 经营主体信息</a>{" "}
          填一份，所有页面都能选用。
        </p>
      )}
      <Field label="隐私政策" hint="这段文字既显示在页脚，也构成落地页的 /privacy 政策页。">
        <TextArea rows={4} value={value.privacyPolicy} onChange={(e) => patch({ privacyPolicy: e.target.value })} />
      </Field>
      <Field label="服务条款" hint="同上，对应 /terms。">
        <TextArea rows={4} value={value.termsOfService} onChange={(e) => patch({ termsOfService: e.target.value })} />
      </Field>
    </div>
  );
}
