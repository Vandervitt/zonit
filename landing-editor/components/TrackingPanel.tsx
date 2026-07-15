// landing-editor/components/TrackingPanel.tsx
"use client";
import { useState, useEffect } from "react";
import { useEditorState, useEditorDispatch } from "../store/editorStore";
import { useMeta } from "../MetaContext";
import type { PixelProvider } from "@/types/schema.draft";
import { PLANS } from "@/lib/plans";
import { apiCapiCredentialsPath } from "@/lib/constants";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";

/** 单 provider 的 CAPI 配置行：启用开关 + 凭据写入（token 不回显）。 */
function CapiRow({ pageId, provider, label }: { pageId: string; provider: "meta" | "tiktok"; label: string }) {
  const [configured, setConfigured] = useState(false);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [externalId, setExternalId] = useState("");

  useEffect(() => {
    let active = true;
    fetch(apiCapiCredentialsPath(pageId))
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { provider: string }[]) => {
        if (active) { const c = list.some((x) => x.provider === provider); setConfigured(c); setOpen(c); }
      })
      .catch(() => {});
    return () => { active = false; };
  }, [pageId, provider]);

  const save = async () => {
    if (!token.trim() || !externalId.trim()) return;
    const r = await fetch("/api/capi-credentials", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pageId, provider, accessToken: token.trim(), externalId: externalId.trim() }),
    });
    if (r.ok) { setConfigured(true); setToken(""); }
  };
  const disable = async () => {
    await fetch(`/api/capi-credentials?pageId=${encodeURIComponent(pageId)}&provider=${provider}`, { method: "DELETE" });
    setConfigured(false); setOpen(false); setToken(""); setExternalId("");
  };

  return (
    <div className="rounded-md border border-edge p-2.5">
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={open}
          onChange={(e) => (e.target.checked ? setOpen(true) : disable())}
          className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
        />
        启用服务端回传（CAPI · {label}）{configured ? " · 已配置 ✓" : ""}
      </label>
      {open && (
        <div className="mt-2 space-y-2">
          <Field label={provider === "meta" ? "Dataset ID" : "Pixel Code"}>
            <TextInput value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder={provider === "meta" ? "如 1234567890" : "如 CXXXXXXXX"} />
          </Field>
          <Field label="Access Token">
            <TextInput value={token} onChange={(e) => setToken(e.target.value)} placeholder={configured ? "重填以覆盖（不回显已存）" : "粘贴 Access Token"} />
          </Field>
          <button type="button" onClick={save} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">保存凭据</button>
        </div>
      )}
    </div>
  );
}

const PROVIDERS: { provider: PixelProvider; label: string; placeholder: string }[] = [
  { provider: "meta", label: "Meta Pixel ID", placeholder: "如 1234567890" },
  { provider: "ga4", label: "Google Analytics（GA4）ID", placeholder: "如 G-XXXXXXX" },
  { provider: "googleAds", label: "Google Ads 转化 ID", placeholder: "如 AW-XXXXXXXXX" },
  { provider: "tiktok", label: "TikTok Pixel ID", placeholder: "如 CXXXXXXXXXXXXXXXXX" },
];

export function TrackingPanel({ onClose }: { onClose: () => void }) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const { pageId, plan } = useMeta();
  // free/starter 仅「基础数据追踪 (1× Meta Pixel)」；TikTok/GA4/GoogleAds 与服务端 CAPI 属高级追踪。
  const advanced = PLANS[plan].advancedTracking;
  const t = state.tracking;

  const setPixel = (provider: PixelProvider, id: string) => {
    const rest = t.pixels.filter((p) => p.provider !== provider);
    const trimmed = id.trim();
    const pixels = trimmed ? [...rest, { provider, id: trimmed, enabled: true }] : rest;
    dispatch({ kind: "updateTracking", value: { ...t, pixels } });
  };
  const idOf = (provider: PixelProvider) => t.pixels.find((p) => p.provider === provider)?.id ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[460px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">追踪与转化</h2>
        <p className="mt-1 text-xs text-ink-muted">填入各平台 Pixel ID（留空即不启用）。事件按系统内置规则上报，仅咨询/留资，无交易语义。</p>

        <div className="mt-4 space-y-3">
          {PROVIDERS.map(({ provider, label, placeholder }) => {
            const locked = !advanced && provider !== "meta";
            return (
              <Field key={provider} label={locked ? `${label}（Pro 解锁全矩阵像素）` : label}>
                <TextInput
                  value={locked ? "" : idOf(provider)}
                  onChange={(e) => setPixel(provider, e.target.value)}
                  placeholder={locked ? "升级 Pro 解锁 TikTok / GA4 / Google Ads" : placeholder}
                  disabled={locked}
                />
              </Field>
            );
          })}

          {advanced && pageId ? (
            <div className="space-y-2 border-t border-edge pt-3">
              <p className="text-xs font-medium text-ink-soft">服务端转化回传（CAPI）</p>
              <CapiRow pageId={pageId} provider="meta" label="Meta" />
              <CapiRow pageId={pageId} provider="tiktok" label="TikTok" />
            </div>
          ) : !advanced ? (
            <div className="border-t border-edge pt-3">
              <p className="text-xs text-ink-muted">服务端转化回传（CAPI · Meta / TikTok）为 Pro 及以上套餐权益，升级后解锁。</p>
            </div>
          ) : null}

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
