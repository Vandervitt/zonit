"use client";
// landing-editor/ui/EmojiInput.tsx
// 文本输入 + 精选 emoji 快速选择器（无依赖）。点选即填入，仍可手动输入。
import { useAdminT } from "@/lib/i18n/admin/context";
import { useState } from "react";

// 落地页常用营销 emoji（信任 / 速度 / 价值 / 联系 / 庆祝）
const EMOJIS = [
  "⭐", "🌟", "✨", "💫", "🔥", "⚡", "💎", "🏆", "🎯", "✅",
  "🛡️", "🔒", "🤝", "👍", "💪", "❤️", "😊", "😍", "🎉", "🎁",
  "🚀", "📈", "⏰", "⏳", "📞", "📱", "💬", "📧", "🌍", "📍",
  "🥇", "🎖️", "💯", "🩺", "💊", "💄", "🧴", "🌿", "👩‍⚕️", "🧑‍💼",
];

export function EmojiInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const t = useAdminT().editor.ui;
  const f = useAdminT().editor.fields;
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-edge bg-panel px-2.5 py-1.5 text-sm text-ink transition-colors placeholder:text-ink-muted focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
        />
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-label={t.pickEmoji}
          aria-expanded={open}
          className="shrink-0 rounded-md border border-edge px-2 py-1.5 text-sm transition-colors hover:border-brand-400"
        >
          😀
        </button>
      </div>

      {open ? (
        <>
          <button
            type="button"
            aria-label={f.close}
            className="fixed inset-0 z-10 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div className="absolute right-0 z-20 mt-1.5 w-60 rounded-lg border border-edge bg-panel p-2 shadow-lg">
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onChange(emoji);
                    setOpen(false);
                  }}
                  className="rounded p-1 text-lg leading-none transition-colors hover:bg-brand-50"
                >
                  {emoji}
                </button>
              ))}
            </div>
            {value ? (
              <button
                type="button"
                onClick={() => {
                  onChange("");
                  setOpen(false);
                }}
                className="mt-1.5 w-full rounded-md px-2 py-1 text-xs text-ink-muted transition-colors hover:bg-brand-50"
              >
                {t.clear}
              </button>
            ) : null}
          </div>
        </>
      ) : null}
    </div>
  );
}
