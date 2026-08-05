"use client";
// landing-editor/forms/fields.tsx
// 按 schema 形状封装的复合字段，建立在通用 ui 原子之上。
import { useAdminT } from "@/lib/i18n/admin/context";
import type { ReactNode } from "react";
import type { CtaButton, ImageRef, Badge, Media, IconHeading } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { Select } from "../ui/Select";
import { EmojiInput } from "../ui/EmojiInput";
import { MediaPicker } from "../ui/MediaPicker";
import { validateLink, validateMediaUrl } from "../lib/validate";
import { RewriteButton } from "@/components/ai/RewriteButton";

export function CtaButtonField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: CtaButton;
  onChange: (v: CtaButton) => void;
}) {
  const d = useAdminT().editor;
  const t = d.fieldKit;
  const f = d.fields;
  const issuesT = d.issues;
  return (
    <div className="space-y-2 rounded-lg border border-edge p-2.5">
      <div className="text-xs font-medium text-ink-soft">{label ?? t.ctaButton}</div>
      <div className="space-y-1">
        <Field label={f.buttonText}>
          <TextInput value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder={t.ctaPlaceholder} />
        </Field>
        <RewriteButton field={f.buttonText} currentText={value.text} onApply={(t) => onChange({ ...value, text: t })} />
      </div>
      {/* 阶段 1：链接已改由页面级 contact 统一决定，不再逐个编辑。
          阶段 2 上线「联系方式」面板后，这行提示替换为指向该面板的入口。 */}
      <p className="text-xs text-slate-500">{t.linkManagedNote}</p>
    </div>
  );
}

export function ImageRefField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: ImageRef;
  onChange: (v: ImageRef) => void;
}) {
  const d = useAdminT().editor;
  const t = d.fieldKit;
  const f = d.fields;
  const issuesT = d.issues;
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-edge p-2.5">
      <div className="text-xs font-medium text-ink-soft">{label ?? f.image}</div>
      <Field label={t.imageSource} error={validateMediaUrl(value.src, issuesT)}>
        <MediaPicker
          value={value.src}
          accept="image"
          onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })}
        />
      </Field>
      <Field label={f.altText}>
        <TextInput
          value={value.alt ?? ""}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder={t.altPlaceholder}
        />
      </Field>
    </div>
  );
}

export function BadgeField({ value, onChange }: { value: Badge; onChange: (v: Badge) => void }) {
  const d = useAdminT().editor;
  const t = d.fieldKit;
  const f = d.fields;
  const issuesT = d.issues;
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <Field label="Emoji">
        <EmojiInput value={value.emoji ?? ""} onChange={(emoji) => onChange({ ...value, emoji })} placeholder="🎁" />
      </Field>
      <Field label={f.badgeText}>
        <TextInput value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder={t.badgePlaceholder} />
      </Field>
    </div>
  );
}

export function IconHeadingField({
  label,
  value,
  onChange,
}: {
  label?: string;
  value: IconHeading;
  onChange: (v: IconHeading) => void;
}) {
  const d = useAdminT().editor;
  const t = d.fieldKit;
  const f = d.fields;
  const issuesT = d.issues;
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <Field label={f.icon}>
        <EmojiInput value={value.icon ?? ""} onChange={(icon) => onChange({ ...value, icon })} placeholder="⏰" />
      </Field>
      <Field label={label ?? t.headlineCopy}>
        <TextInput value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
      </Field>
    </div>
  );
}

export function MediaField({ value, onChange }: { value: Media; onChange: (v: Media) => void }) {
  const d = useAdminT().editor;
  const t = d.fieldKit;
  const f = d.fields;
  const issuesT = d.issues;
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-edge p-2.5">
      <Field label={t.mediaType}>
        <Select
          value={value.type}
          onChange={(e) => {
            const type = e.target.value as Media["type"];
            onChange(type === "image" ? { type, src: value.src, alt: "" } : { type, src: value.src, poster: "" });
          }}
        >
          <option value="image">{f.image}</option>
          <option value="video">{f.video}</option>
        </Select>
      </Field>
      <Field label={t.source} error={validateMediaUrl(value.src, issuesT)}>
        <MediaPicker
          value={value.src}
          accept={value.type}
          onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })}
        />
      </Field>
      {value.type === "image" ? (
        <Field label={f.altText}>
          <TextInput value={value.alt ?? ""} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
        </Field>
      ) : (
        <Field label={t.videoPoster}>
          <TextInput value={value.poster ?? ""} onChange={(e) => onChange({ ...value, poster: e.target.value })} />
        </Field>
      )}
    </div>
  );
}

/** 可选子结构开关：勾选后展开内容，取消则置空。onToggle 由调用方决定填充默认值或 undefined。 */
export function Optional({
  label,
  present,
  onToggle,
  children,
}: {
  label: string;
  present: boolean;
  onToggle: (on: boolean) => void;
  children: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-edge p-2.5">
      <label className="flex cursor-pointer items-center gap-2 text-xs font-medium text-ink-soft">
        <input
          type="checkbox"
          checked={present}
          onChange={(e) => onToggle(e.target.checked)}
          className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
        />
        {label}
      </label>
      {present ? <div className="mt-2 space-y-2">{children}</div> : null}
    </div>
  );
}

/** 通用「主标题 + 可选副标题」字段，适用于多数区块。 */
export function TitleSubtitleFields<T extends { title: string; subtitle?: string }>({
  value,
  patch,
}: {
  value: T;
  patch: (p: Partial<T>) => void;
}) {
  const d = useAdminT().editor;
  const t = d.fieldKit;
  const f = d.fields;
  const issuesT = d.issues;
  return (
    <>
      <div className="space-y-1">
        <Field label={f.title}>
          <TextInput value={value.title} onChange={(e) => patch({ title: e.target.value } as Partial<T>)} />
        </Field>
        <RewriteButton field={f.title} currentText={value.title} onApply={(t) => patch({ title: t } as Partial<T>)} />
      </div>
      <div className="space-y-1">
        <Field label={f.subtitle}>
          <TextInput
            value={value.subtitle ?? ""}
            onChange={(e) => patch({ subtitle: e.target.value || undefined } as Partial<T>)}
          />
        </Field>
        <RewriteButton
          field={f.subtitle}
          currentText={value.subtitle ?? ""}
          onApply={(t) => patch({ subtitle: t || undefined } as Partial<T>)}
        />
      </div>
    </>
  );
}
