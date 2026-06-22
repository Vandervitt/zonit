"use client";
// landing-editor/forms/fields.tsx
// 按 schema 形状封装的复合字段，建立在通用 ui 原子之上。
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
  label = "CTA 按钮",
  value,
  onChange,
}: {
  label?: string;
  value: CtaButton;
  onChange: (v: CtaButton) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-edge p-2.5">
      <div className="text-xs font-medium text-ink-soft">{label}</div>
      <div className="space-y-1">
        <Field label="按钮文案">
          <TextInput value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder="立即咨询" />
        </Field>
        <RewriteButton field="按钮文案" currentText={value.text} onApply={(t) => onChange({ ...value, text: t })} />
      </div>
      <Field label="按钮链接" error={validateLink(value.link)}>
        <TextInput
          value={value.link}
          onChange={(e) => onChange({ ...value, link: e.target.value })}
          placeholder="https://… / tel: / mailto:"
        />
      </Field>
    </div>
  );
}

export function ImageRefField({
  label = "图片",
  value,
  onChange,
}: {
  label?: string;
  value: ImageRef;
  onChange: (v: ImageRef) => void;
}) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-edge p-2.5">
      <div className="text-xs font-medium text-ink-soft">{label}</div>
      <Field label="图片资源" error={validateMediaUrl(value.src)}>
        <MediaPicker
          value={value.src}
          accept="image"
          onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })}
        />
      </Field>
      <Field label="Alt 文本">
        <TextInput
          value={value.alt ?? ""}
          onChange={(e) => onChange({ ...value, alt: e.target.value })}
          placeholder="图片描述（SEO / 无障碍）"
        />
      </Field>
    </div>
  );
}

export function BadgeField({ value, onChange }: { value: Badge; onChange: (v: Badge) => void }) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <Field label="Emoji">
        <EmojiInput value={value.emoji ?? ""} onChange={(emoji) => onChange({ ...value, emoji })} placeholder="🎁" />
      </Field>
      <Field label="标签文案">
        <TextInput value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} placeholder="限时优惠" />
      </Field>
    </div>
  );
}

export function IconHeadingField({
  label = "主标题文案",
  value,
  onChange,
}: {
  label?: string;
  value: IconHeading;
  onChange: (v: IconHeading) => void;
}) {
  return (
    <div className="grid grid-cols-[7rem_1fr] gap-2">
      <Field label="图标">
        <EmojiInput value={value.icon ?? ""} onChange={(icon) => onChange({ ...value, icon })} placeholder="⏰" />
      </Field>
      <Field label={label}>
        <TextInput value={value.text} onChange={(e) => onChange({ ...value, text: e.target.value })} />
      </Field>
    </div>
  );
}

export function MediaField({ value, onChange }: { value: Media; onChange: (v: Media) => void }) {
  return (
    <div className="space-y-2 rounded-lg border border-dashed border-edge p-2.5">
      <Field label="媒体类型">
        <Select
          value={value.type}
          onChange={(e) => {
            const type = e.target.value as Media["type"];
            onChange(type === "image" ? { type, src: value.src, alt: "" } : { type, src: value.src, poster: "" });
          }}
        >
          <option value="image">图片</option>
          <option value="video">视频</option>
        </Select>
      </Field>
      <Field label="资源" error={validateMediaUrl(value.src)}>
        <MediaPicker
          value={value.src}
          accept={value.type}
          onChange={(src, alt) => onChange({ ...value, src, ...(alt !== undefined ? { alt } : {}) })}
        />
      </Field>
      {value.type === "image" ? (
        <Field label="Alt 文本">
          <TextInput value={value.alt ?? ""} onChange={(e) => onChange({ ...value, alt: e.target.value })} />
        </Field>
      ) : (
        <Field label="视频封面 URL">
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
  return (
    <>
      <div className="space-y-1">
        <Field label="主标题">
          <TextInput value={value.title} onChange={(e) => patch({ title: e.target.value } as Partial<T>)} />
        </Field>
        <RewriteButton field="主标题" currentText={value.title} onApply={(t) => patch({ title: t } as Partial<T>)} />
      </div>
      <div className="space-y-1">
        <Field label="副标题">
          <TextInput
            value={value.subtitle ?? ""}
            onChange={(e) => patch({ subtitle: e.target.value || undefined } as Partial<T>)}
          />
        </Field>
        <RewriteButton
          field="副标题"
          currentText={value.subtitle ?? ""}
          onApply={(t) => patch({ subtitle: t || undefined } as Partial<T>)}
        />
      </div>
    </>
  );
}
