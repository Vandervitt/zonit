"use client";
// landing-editor/forms/FloatingButtonForm.tsx
import type { FloatingButton } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";
import { validateLink } from "../lib/validate";

export function FloatingButtonForm({ value, onChange }: { value: FloatingButton; onChange: (v: FloatingButton) => void }) {
  const patch = (p: Partial<FloatingButton>) => onChange({ ...value, ...p });

  return (
    <div className="space-y-3">
      <Field label="按钮文案">
        <TextInput value={value.text} onChange={(e) => patch({ text: e.target.value })} placeholder="立即咨询" />
      </Field>
      {/* 阶段 1：链接已改由页面级 contact 统一决定。阶段 2 这里会变成渠道选择器
          （悬浮按钮可独立于主渠道，「主推表单 + 悬浮 WhatsApp」是核心组合）。 */}
      <p className="text-xs text-slate-500">按钮链接由页面的「联系方式」统一决定，不在此单独设置。</p>
    </div>
  );
}
