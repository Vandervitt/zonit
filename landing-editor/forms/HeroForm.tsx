"use client";
// landing-editor/forms/HeroForm.tsx
import { useAdminT } from "@/lib/i18n/admin/context";
import type { HeroSection } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { BadgeField, CtaButtonField, ImageRefField, MediaField, Optional } from "./fields";

export function HeroForm({ value, onChange }: { value: HeroSection; onChange: (v: HeroSection) => void }) {
  const d = useAdminT().editor;
  const t = d.forms.hero;
  const f = d.fields;
  const patch = (p: Partial<HeroSection>) => onChange({ ...value, ...p });

  return (
    <div className="space-y-3">
      <Field label={f.title}>
        <TextInput value={value.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label={f.subtitle}>
        <TextArea value={value.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value || undefined })} />
      </Field>

      <Optional
        label={t.badge}
        present={value.badge !== undefined}
        onToggle={(on) => patch({ badge: on ? { text: "" } : undefined })}
      >
        {value.badge ? <BadgeField value={value.badge} onChange={(v) => patch({ badge: v })} /> : null}
      </Optional>

      <CtaButtonField label={t.primaryCta} value={value.cta} onChange={(v) => patch({ cta: v })} />

      <Optional
        label={t.secondaryCta}
        present={value.secondaryCta !== undefined}
        onToggle={(on) => patch({ secondaryCta: on ? { text: "", target: { kind: "url" as const, url: "" } } : undefined })}
      >
        {value.secondaryCta ? (
          <CtaButtonField label={t.secondaryCta} value={value.secondaryCta} onChange={(v) => patch({ secondaryCta: v })} />
        ) : null}
      </Optional>

      <Field label={t.endorsement}>
        <TextInput
          value={value.endorsementText ?? ""}
          onChange={(e) => patch({ endorsementText: e.target.value || undefined })}
          placeholder={t.endorsementPlaceholder}
        />
      </Field>

      <Optional
        label={t.backgroundImage}
        present={value.backgroundImage !== undefined}
        onToggle={(on) => patch({ backgroundImage: on ? { src: "" } : undefined })}
      >
        {value.backgroundImage ? (
          <ImageRefField label={f.backgroundImage} value={value.backgroundImage} onChange={(v) => patch({ backgroundImage: v })} />
        ) : null}
      </Optional>

      <Optional
        label={t.showcase}
        present={value.showcase !== undefined}
        onToggle={(on) => patch({ showcase: on ? { type: "image", src: "", alt: "" } : undefined })}
      >
        {value.showcase ? <MediaField value={value.showcase} onChange={(v) => patch({ showcase: v })} /> : null}
      </Optional>
    </div>
  );
}
