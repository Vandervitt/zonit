"use client";
// landing-editor/forms/HeroForm.tsx
import type { HeroSection } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { TextArea } from "../ui/TextArea";
import { BadgeField, CtaButtonField, ImageRefField, MediaField, Optional } from "./fields";

export function HeroForm({ value, onChange }: { value: HeroSection; onChange: (v: HeroSection) => void }) {
  const patch = (p: Partial<HeroSection>) => onChange({ ...value, ...p });

  return (
    <div className="space-y-3">
      <Field label="主标题">
        <TextInput value={value.title} onChange={(e) => patch({ title: e.target.value })} />
      </Field>
      <Field label="副标题">
        <TextArea value={value.subtitle ?? ""} onChange={(e) => patch({ subtitle: e.target.value || undefined })} />
      </Field>

      <Optional
        label="顶部标签 Badge"
        present={value.badge !== undefined}
        onToggle={(on) => patch({ badge: on ? { text: "" } : undefined })}
      >
        {value.badge ? <BadgeField value={value.badge} onChange={(v) => patch({ badge: v })} /> : null}
      </Optional>

      <CtaButtonField label="主按钮 CTA" value={value.cta} onChange={(v) => patch({ cta: v })} />

      <Optional
        label="副按钮"
        present={value.secondaryCta !== undefined}
        onToggle={(on) => patch({ secondaryCta: on ? { text: "", link: "" } : undefined })}
      >
        {value.secondaryCta ? (
          <CtaButtonField label="副按钮" value={value.secondaryCta} onChange={(v) => patch({ secondaryCta: v })} />
        ) : null}
      </Optional>

      <Field label="背书文字">
        <TextInput
          value={value.endorsementText ?? ""}
          onChange={(e) => patch({ endorsementText: e.target.value || undefined })}
          placeholder="如：10 分钟内回复"
        />
      </Field>

      <Optional
        label="背景图（缺省用主题色兜底）"
        present={value.backgroundImage !== undefined}
        onToggle={(on) => patch({ backgroundImage: on ? { src: "" } : undefined })}
      >
        {value.backgroundImage ? (
          <ImageRefField label="背景图" value={value.backgroundImage} onChange={(v) => patch({ backgroundImage: v })} />
        ) : null}
      </Optional>

      <Optional
        label="产品展示（图片 / 视频）"
        present={value.showcase !== undefined}
        onToggle={(on) => patch({ showcase: on ? { type: "image", src: "", alt: "" } : undefined })}
      >
        {value.showcase ? <MediaField value={value.showcase} onChange={(v) => patch({ showcase: v })} /> : null}
      </Optional>
    </div>
  );
}
