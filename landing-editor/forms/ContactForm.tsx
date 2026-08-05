"use client";
// landing-editor/forms/ContactForm.tsx
// 联系方式面板：全页 CTA 落点的单一真源。选主渠道 + 填各渠道的值 + 指定悬浮按钮渠道。
//
// 交互刻意做成「一个单选 + 若干输入框」而不是逐个 CTA 配置：用户只需要回答
// 「客户怎么找我」，160 个落点的连接由平台负责。每个选项带适用场景与代价说明——
// 用户未必是专业投手，把选择权交出去而不解释等于把难题原样丢回去。
import type { LandingPageDraft, LeadChannel, PageContact } from "@/types/schema.draft";
import { CHANNEL_ORDER, type ChannelGuidance } from "../lib/channelGuidance";
import { useAdminT } from "@/lib/i18n/admin/context";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";

/** 悬浮按钮可挂的渠道（表单除外——悬浮按钮的意义就是绕开表单直接联系）。 */
const FLOATING_CHANNELS: Exclude<LeadChannel, "form">[] = ["whatsapp", "phone", "telegram", "email"];

export function ContactForm({
  value,
  leadFormEnabled,
  floatingChannel,
  onPrimaryChange,
  onValueChange,
  onFloatingChannelChange,
}: {
  value: PageContact;
  /** 主渠道选表单时要提示先启用表单，故需要知道它的状态。 */
  leadFormEnabled: boolean;
  /** 悬浮按钮当前挂的渠道；页面没有悬浮按钮时为 null。 */
  floatingChannel: LeadChannel | null;
  onPrimaryChange: (channel: LeadChannel) => void;
  onValueChange: (next: PageContact) => void;
  onFloatingChannelChange: (channel: LeadChannel) => void;
}) {
  const d = useAdminT().editor;
  const t = d.channels;
  const form = d.forms.contact;
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-edge bg-panel-soft p-3 text-xs leading-relaxed text-ink-soft">
        <p className="font-medium text-ink">{t.intro.question}</p>
        <p className="mt-1.5">{t.intro.needInfo}</p>
        <p>{t.intro.noInfo}</p>
        <p className="mt-1.5 text-ink-muted">{t.intro.both}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-ink-soft">{form.primary}</legend>
        {CHANNEL_ORDER.map((channel) => {
          const g: ChannelGuidance = t[channel];
          const selected = value.primary === channel;
          return (
            <div
              key={channel}
              className={`rounded-lg border p-3 transition-colors ${
                selected ? "border-brand-500 bg-brand-50" : "border-edge bg-panel"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-2.5">
                <input
                  type="radio"
                  name="primary-channel"
                  value={channel}
                  checked={selected}
                  onChange={() => onPrimaryChange(channel)}
                  className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-ink">{g.label}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-soft">{g.what}</span>
                  <span className="mt-1 block text-xs leading-relaxed text-ink-muted">{t.fitForPrefix}{g.fitFor}</span>
                  {g.tradeoff ? (
                    <span className="mt-1 block text-xs leading-relaxed text-amber-700">⚠ {g.tradeoff}</span>
                  ) : null}
                </span>
              </label>

              {channel === "form" ? (
                selected && !leadFormEnabled ? (
                  <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                    {t.enableFormFirst}
                  </p>
                ) : null
              ) : (
                <div className="mt-2.5">
                  <Field label={t.yourChannel(g.label)}>
                    <TextInput
                      value={value[channel] ?? ""}
                      onChange={(e) => onValueChange({ ...value, [channel]: e.target.value })}
                      placeholder={g.placeholder}
                    />
                  </Field>
                </div>
              )}
            </div>
          );
        })}
      </fieldset>

      {floatingChannel !== null ? (
        <div className="rounded-lg border border-edge bg-panel p-3">
          <Field label={form.floatingChannel}>
            <select
              value={floatingChannel}
              onChange={(e) => onFloatingChannelChange(e.target.value as LeadChannel)}
              className="w-full rounded-md border border-edge bg-panel px-2.5 py-1.5 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {FLOATING_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {t[c].label}
                </option>
              ))}
            </select>
          </Field>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            {t.floatingHint}
          </p>
        </div>
      ) : null}
    </div>
  );
}

/** 从 draft 读出悬浮按钮当前挂的渠道；没有悬浮按钮或它指向外链时返回 null。 */
export function floatingChannelOf(draft: Pick<LandingPageDraft, "floatingButton" | "contact">): LeadChannel | null {
  const target = draft.floatingButton?.target;
  if (!target) return null;
  if (target.kind === "channel") return target.channel;
  if (target.kind === "primary") return draft.contact.primary;
  return null; // url 落点不由本面板管
}
