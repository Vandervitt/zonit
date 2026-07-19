"use client";
import { useEffect, useState } from "react";
import { useMeta } from "../MetaContext";
import { apiLandingPublishPath, Routes } from "@/lib/constants";

interface DomainRow {
  id: string;
  domain: string;
  enabled: boolean;
  verified: boolean;
  landing_page_id?: string | null;
  landing_page_name?: string;
}

export function PublishDialog({ onClose }: { onClose: () => void }) {
  const { pageId, setStatus, setPublishedDirty, flushSaveRef } = useMeta();
  // domains === null 表示仍在加载：与「确认没有可用域名」区分，避免闪现空态。
  const [domains, setDomains] = useState<DomainRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [domainId, setDomainId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [liveUrl, setLiveUrl] = useState("");

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/domains");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const all: DomainRow[] = await res.json();
        const usable = all.filter((d) => d.enabled && d.verified);
        setDomains(usable);
        // 优先预选当前页已绑定的域名（更新发布不换绑），否则取第一个。
        const bound = usable.find((d) => d.landing_page_id === pageId);
        const preset = bound ?? usable[0];
        if (preset) setDomainId(preset.id);
      } catch {
        setLoadFailed(true);
      }
    })();
  }, [pageId]);

  const selected = domains?.find((d) => d.id === domainId);
  // 所选域名已在服务另一张页面：发布即改绑，旧页面将从该域名下线。
  const rebinding = !!selected?.landing_page_id && selected.landing_page_id !== pageId;

  async function publish() {
    if (!domainId || busy) return;
    setBusy(true);
    setError("");
    try {
      // 先把编辑器内可能还在防抖窗口的草稿落库，确保服务端校验/发布的是最新内容。
      const flushed = await flushSaveRef.current?.();
      if (flushed === false) {
        setError("草稿保存失败，请检查网络后重试");
        return;
      }
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
      setStatus("published");
      setPublishedDirty(false); // 刚发布：线上快照与草稿一致
    } catch {
      setError("发布失败，请检查网络后重试");
    } finally {
      setBusy(false);
    }
  }

  function domainLabel(d: DomainRow): string {
    if (d.landing_page_id === pageId) return `${d.domain}（当前页面）`;
    if (d.landing_page_id) return `${d.domain}（已绑定：${d.landing_page_name ?? "其他页面"}）`;
    return d.domain;
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
        ) : loadFailed ? (
          <div className="mt-4 space-y-3 text-sm text-ink-soft">
            <p>域名列表加载失败，请检查网络后重试。</p>
            <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-ink hover:bg-canvas">关闭</button>
          </div>
        ) : domains === null ? (
          <p className="mt-4 text-sm text-ink-soft">正在加载域名…</p>
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
                <option key={d.id} value={d.id}>{domainLabel(d)}</option>
              ))}
            </select>
            {rebinding && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                该域名当前正在服务「{selected?.landing_page_name ?? "其他页面"}」。继续发布会把域名改绑到本页面，原页面将立即从该域名下线（若有广告在投请先确认）。
              </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft">取消</button>
              <button
                onClick={publish}
                disabled={busy}
                className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ${rebinding ? "bg-amber-600 hover:bg-amber-700" : "bg-brand-600 hover:bg-brand-700"}`}
              >
                {busy ? "发布中…" : rebinding ? "改绑并发布" : "确认发布"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
