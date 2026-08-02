"use client";
// landing-editor/forms/ContactForm.tsx
// 联系方式面板：全页 CTA 落点的单一真源。选主渠道 + 填各渠道的值 + 指定悬浮按钮渠道。
//
// 交互刻意做成「一个单选 + 若干输入框」而不是逐个 CTA 配置：用户只需要回答
// 「客户怎么找我」，160 个落点的连接由平台负责。每个选项带适用场景与代价说明——
// 用户未必是专业投手，把选择权交出去而不解释等于把难题原样丢回去。
import type { LandingPageDraft, LeadChannel, PageContact } from "@/types/schema.draft";
import { CHANNEL_GUIDANCE, CHANNEL_INTRO, CHANNEL_ORDER } from "../lib/channelGuidance";
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
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-edge bg-panel-soft p-3 text-xs leading-relaxed text-ink-soft">
        <p className="font-medium text-ink">{CHANNEL_INTRO.question}</p>
        <p className="mt-1.5">{CHANNEL_INTRO.needInfo}</p>
        <p>{CHANNEL_INTRO.noInfo}</p>
        <p className="mt-1.5 text-ink-muted">{CHANNEL_INTRO.both}</p>
      </div>

      <fieldset className="space-y-2">
        <legend className="mb-2 text-xs font-medium text-ink-soft">主要联系方式</legend>
        {CHANNEL_ORDER.map((channel) => {
          const g = CHANNEL_GUIDANCE[channel];
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
                  <span className="mt-1 block text-xs leading-relaxed text-ink-muted">适合：{g.fitFor}</span>
                  {g.tradeoff ? (
                    <span className="mt-1 block text-xs leading-relaxed text-amber-700">⚠ {g.tradeoff}</span>
                  ) : null}
                </span>
              </label>

              {channel === "form" ? (
                selected && !leadFormEnabled ? (
                  <p className="mt-2 rounded-md bg-amber-50 px-2 py-1.5 text-xs text-amber-800">
                    请先在左栏打开「留资表单」，否则访客点击主按钮不会有任何反应。
                  </p>
                ) : null
              ) : (
                <div className="mt-2.5">
                  <Field label={`你的 ${g.label}`}>
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
          <Field label="悬浮按钮挂哪个渠道">
            <select
              value={floatingChannel}
              onChange={(e) => onFloatingChannelChange(e.target.value as LeadChannel)}
              className="w-full rounded-md border border-edge bg-panel px-2.5 py-1.5 text-sm text-ink focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              {FLOATING_CHANNELS.map((c) => (
                <option key={c} value={c}>
                  {CHANNEL_GUIDANCE[c].label}
                </option>
              ))}
            </select>
          </Field>
          <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
            右下角常驻的小按钮，可以和主按钮不同。主按钮用表单时，这里挂 WhatsApp
            可以同时接住想直接问一句的访客。
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
