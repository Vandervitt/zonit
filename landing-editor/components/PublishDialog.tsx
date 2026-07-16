"use client";
import { useEffect, useState } from "react";
import { useMeta } from "../MetaContext";
import { apiLandingPublishPath, Routes } from "@/lib/constants";

interface DomainRow {
  id: string;
  domain: string;
  enabled: boolean;
  verified: boolean;
}

export function PublishDialog({ onClose }: { onClose: () => void }) {
  const { pageId } = useMeta();
  const [domains, setDomains] = useState<DomainRow[]>([]);
  const [domainId, setDomainId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  useEffect(() => {
    void (async () => {
      const res = await fetch("/api/domains");
      if (!res.ok) return;
      const all: DomainRow[] = await res.json();
      const usable = all.filter((d) => d.enabled && d.verified);
      setDomains(usable);
      if (usable[0]) setDomainId(usable[0].id);
    })();
  }, []);

  async function publish() {
    if (!domainId || busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await fetch(apiLandingPublishPath(pageId), {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domainId }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "validation_failed" ? "页面校验未通过，无法发布"
          : json.error === "domain_required" ? "请选择一个已验证的域名"
          : json.error === "domain_not_verified" ? "所选域名未验证"
          : "发布失败",
        );
        return;
      }
      setLiveUrl(`https://${json.domain}/`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[420px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">发布到自有域名</h2>

        {liveUrl ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-ink-soft">已发布，对外链接：</p>
            <a href={liveUrl} target="_blank" className="block break-all text-brand-600 hover:underline">{liveUrl}</a>
            <button onClick={onClose} className="mt-2 rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white">完成</button>
          </div>
        ) : domains.length === 0 ? (
          <div className="mt-4 space-y-3 text-sm text-ink-soft">
            <p>你还没有已验证的自有域名。请先到「Domains」绑定并验证一个域名，再回来发布。</p>
            <a href={Routes.Domains} className="inline-block rounded-md border border-edge px-3 py-1.5 text-ink hover:bg-canvas">去绑定域名</a>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-ink-soft">选择域名</label>
            <select
              value={domainId}
              onChange={(e) => setDomainId(e.target.value)}
              className="w-full rounded-md border border-edge bg-canvas px-3 py-2 text-sm text-ink"
            >
              {domains.map((d) => (
                <option key={d.id} value={d.id}>{d.domain}</option>
              ))}
            </select>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft">取消</button>
              <button onClick={publish} disabled={busy} className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60">
                {busy ? "发布中…" : "确认发布"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
