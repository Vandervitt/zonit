"use client";
import { useAdminT, useAdminLocale } from "@/lib/i18n/admin/context";
import { formatDateTime } from "@/lib/i18n/admin";
import { useState } from "react";
import { useMeta } from "../MetaContext";
import { apiLandingPreviewLinkPath } from "@/lib/constants/routes";

/** 分享预览面板：生成/复制可分享链接；重置使旧链接失效。链接带水印、noindex、7 天过期、不投放数据。 */
export function SharePreviewPanel({ onClose }: { onClose: () => void }) {
  const t = useAdminT().editor.panels.share;
  const locale = useAdminLocale();
  const { pageId } = useMeta();
  const [url, setUrl] = useState<string>("");
  const [expiresAt, setExpiresAt] = useState<string>("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function request(rotate: boolean) {
    setBusy(true); setError(""); setCopied(false);
    try {
      const res = await fetch(apiLandingPreviewLinkPath(pageId), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rotate }),
      });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      setUrl(data.url); setExpiresAt(data.expiresAt);
    } catch {
      setError(t.failed);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(url); setCopied(true); } catch { /* 用户可手动复制 */ }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[480px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">{t.title}</h2>
        <p className="mt-1 text-xs text-ink-muted">
          {t.intro}
        </p>

        {!url ? (
          <button
            type="button"
            disabled={busy}
            onClick={() => request(false)}
            className="mt-4 rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {busy ? t.generating : t.generate}
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={url}
                className="flex-1 rounded-md border border-edge bg-canvas px-2 py-1.5 text-xs text-ink"
              />
              <button type="button" onClick={copy} className="rounded-md border border-edge px-3 py-1.5 text-xs text-ink-soft hover:bg-canvas">
                {copied ? t.copied : t.copy}
              </button>
            </div>
            {expiresAt && <p className="text-xs text-ink-muted">{t.expiresAt(formatDateTime(expiresAt, locale))}</p>}
            <button
              type="button"
              disabled={busy}
              onClick={() => request(true)}
              className="text-xs text-amber-700 hover:underline disabled:opacity-50"
            >
              {t.reset}
            </button>
          </div>
        )}
        {error && <p className="mt-2 text-xs text-red-500">{error}</p>}

        <div className="mt-5 flex justify-end">
          <button onClick={onClose} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700">
            {t.done}
          </button>
        </div>
      </div>
    </div>
  );
}
