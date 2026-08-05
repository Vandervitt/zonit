// landing-editor/components/TrackingPanel.tsx
"use client";
import { useAdminT } from "@/lib/i18n/admin/context";
import { useState, useEffect } from "react";
import { useEditorState, useEditorDispatch } from "../store/editorStore";
import { useMeta } from "../MetaContext";
import type { PixelProvider } from "@/types/schema.draft";
import { PLANS } from "@/lib/plans";
import { apiCapiCredentialsPath } from "@/lib/constants";
import { Field } from "../ui/Field";
import { TextInput } from "../ui/TextInput";

/**
 * 单 provider 的 CAPI 配置行：启用开关 + 凭据写入（token 不回显）。
 *
 * 凭据有两级：账号级（设置页配一次，全部页共用）与页级（这一张页的覆盖）。
 * 本行必须把两者分辨出来——否则用户看到「已配置 ✓」却不知道删除会影响一张页
 * 还是名下全部页。
 */
function CapiRow({ pageId, provider, label }: { pageId: string; provider: "meta" | "tiktok"; label: string }) {
  const copy = useAdminT().editor.tracking;
  const [scope, setScope] = useState<"page" | "account" | null>(null);
  const [open, setOpen] = useState(false);
  const [token, setToken] = useState("");
  const [externalId, setExternalId] = useState("");
  const configured = scope !== null;

  useEffect(() => {
    let active = true;
    fetch(apiCapiCredentialsPath(pageId))
      .then((r) => (r.ok ? r.json() : []))
      .then((list: { provider: string; scope?: "page" | "account" }[]) => {
        if (!active) return;
        const hit = list.find((x) => x.provider === provider);
        setScope(hit ? hit.scope ?? "page" : null);
        setOpen(Boolean(hit));
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
    if (r.ok) { setScope("page"); setToken(""); }
  };
  /**
   * 只删页级覆盖。账号级凭据在设置页管理——从单张页删掉全账号的凭据
   * 会让名下其它页一起静默停止回传，这类副作用不该藏在一个复选框后面。
   */
  const disable = async () => {
    await fetch(`/api/capi-credentials?pageId=${encodeURIComponent(pageId)}&provider=${provider}`, { method: "DELETE" });
    setScope(null); setOpen(false); setToken(""); setExternalId("");
  };

  return (
    <div className="rounded-md border border-edge p-2.5">
      <label className="flex items-center gap-2 text-sm text-ink-soft">
        <input
          type="checkbox"
          checked={open}
          // 继承账号级时不给关：那不是这张页的配置，取消勾选无从下手。
          // 要停就去设置页删账号级，或在这里填一份页级覆盖。
          disabled={scope === "account"}
          onChange={(e) => (e.target.checked ? setOpen(true) : disable())}
          className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30 disabled:opacity-50"
        />
        {copy.capiEnable(label)}
        {scope === "page" ? copy.capiScopePage : scope === "account" ? copy.capiScopeAccount : ""}
      </label>
      {scope === "account" && (
        <p className="mt-1 text-xs text-ink-muted">
          {copy.capiInherit}
        </p>
      )}
      {open && (
        <div className="mt-2 space-y-2">
          <Field label={provider === "meta" ? "Dataset ID" : "Pixel Code"}>
            <TextInput value={externalId} onChange={(e) => setExternalId(e.target.value)} placeholder={provider === "meta" ? "1234567890" : "CXXXXXXXX"} />
          </Field>
          <Field label="Access Token">
            <TextInput value={token} onChange={(e) => setToken(e.target.value)} placeholder={configured ? copy.capiTokenOverwrite : copy.capiTokenPlaceholder} />
          </Field>
          <button type="button" onClick={save} className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700">
            {scope === "account" ? copy.capiSaveOverride : copy.capiSave}
          </button>
        </div>
      )}
    </div>
  );
}

const PROVIDERS: { provider: PixelProvider; label: string; placeholder: string }[] = [
  // label 是各平台官方术语，placeholder 是 ID 格式样例，两者都与界面语言无关。
  { provider: "meta", label: "Meta Pixel ID", placeholder: "1234567890" },
  { provider: "ga4", label: "Google Analytics (GA4) ID", placeholder: "G-XXXXXXX" },
  { provider: "googleAds", label: "Google Ads Conversion ID", placeholder: "AW-XXXXXXXXX" },
  { provider: "tiktok", label: "TikTok Pixel ID", placeholder: "CXXXXXXXXXXXXXXXXX" },
];

export function TrackingPanel({ onClose }: { onClose: () => void }) {
  const copy = useAdminT().editor.tracking;
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
        <h2 className="text-base font-semibold text-ink">{copy.title}</h2>
        <p className="mt-1 text-xs text-ink-muted">{copy.intro}</p>

        <div className="mt-4 space-y-3">
          {PROVIDERS.map(({ provider, label, placeholder }) => {
            const locked = !advanced && provider !== "meta";
            return (
              <Field key={provider} label={locked ? `${label}${copy.lockedSuffix}` : label}>
                <TextInput
                  value={locked ? "" : idOf(provider)}
                  onChange={(e) => setPixel(provider, e.target.value)}
                  placeholder={locked ? copy.lockedPlaceholder : placeholder}
                  disabled={locked}
                />
              </Field>
            );
          })}

          {advanced && pageId ? (
            <div className="space-y-2 border-t border-edge pt-3">
              <p className="text-xs font-medium text-ink-soft">{copy.capiTitle}</p>
              <CapiRow pageId={pageId} provider="meta" label="Meta" />
              <CapiRow pageId={pageId} provider="tiktok" label="TikTok" />
            </div>
          ) : !advanced ? (
            <div className="border-t border-edge pt-3">
              <p className="text-xs text-ink-muted">{copy.capiUpsell}</p>
            </div>
          ) : null}

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={t.utmPassthrough}
              onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, utmPassthrough: e.target.checked } })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            {copy.passUtm}
          </label>

          <label className="flex items-center gap-2 text-sm text-ink-soft">
            <input
              type="checkbox"
              checked={t.consent.enabled}
              onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, consent: { ...t.consent, enabled: e.target.checked } } })}
              className="h-3.5 w-3.5 rounded border-edge-strong text-brand-600 focus:ring-brand-500/30"
            />
            {copy.consentBar}
          </label>

          {t.consent.enabled && (
            <Field label={copy.consentText}>
              <TextInput
                value={t.consent.text ?? ""}
                onChange={(e) => dispatch({ kind: "updateTracking", value: { ...t, consent: { ...t.consent, text: e.target.value || undefined } } })}
                placeholder={copy.consentPlaceholder}
              />
            </Field>
          )}
        </div>

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">{copy.done}</button>
        </div>
      </div>
    </div>
  );
}
