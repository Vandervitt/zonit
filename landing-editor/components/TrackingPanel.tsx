// landing-editor/components/TrackingPanel.tsx
"use client";
import { useEditorState, useEditorDispatch } from "../store/editorStore";
import type { PixelProvider } from "@/types/schema.draft";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";

const PROVIDERS: { provider: PixelProvider; label: string; placeholder: string }[] = [
  { provider: "meta", label: "Meta Pixel ID", placeholder: "如 1234567890" },
  { provider: "ga4", label: "Google Analytics（GA4）ID", placeholder: "如 G-XXXXXXX" },
  { provider: "googleAds", label: "Google Ads 转化 ID", placeholder: "如 AW-XXXXXXXXX" },
  { provider: "tiktok", label: "TikTok Pixel ID", placeholder: "如 CXXXXXXXXXXXXXXXXX" },
];

export function TrackingPanel({ onClose }: { onClose: () => void }) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const t = state.tracking;

  const setPixel = (provider: PixelProvider, id: string) => {
    const rest = t.pixels.filter((p) => p.provider !== provider);
    const pixels = id.trim() ? [...rest, { provider, id, enabled: true }] : rest;
    dispatch({ kind: "updateTracking", value: { ...t, pixels } });
  };
  const idOf = (provider: PixelProvider) => t.pixels.find((p) => p.provider === provider)?.id ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[460px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">追踪与转化</h2>
        <p className="mt-1 text-xs text-ink-muted">填入各平台 Pixel ID（留空即不启用）。事件按系统内置规则上报，仅咨询/留资，无交易语义。</p>

        <div className="mt-4 space-y-3">
          {PROVIDERS.map(({ provider, label, placeholder }) => (
            <Field key={provider} label={label}>
              <TextInput value={idOf(provider)} onChange={(e) => setPixel(provider, e.target.value)} placeholder={placeholder} />
            </Field>
          ))}

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={t.utmPassthrough}
              onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, utmPassthrough: e.target.checked } })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            把 UTM 透传到 http(s) 外链 CTA
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={t.consent.enabled}
              onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, consent: { ...t.consent, enabled: e.target.checked } } })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            显示 Cookie 同意条（同意前不加载像素）
          </label>

          {t.consent.enabled && (
            <Field label="同意条文案（留空用默认）">
              <TextInput
                value={t.consent.text ?? ""}
                onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, consent: { ...t.consent, text: e.target.value || undefined } } })}
                placeholder="我们使用 Cookie 与第三方分析像素来改善投放效果…"
              />
            </Field>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">完成</button>
        </div>
      </div>
    </div>
  );
}
