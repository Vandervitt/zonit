"use client";
import { useEffect, useState } from "react";
import { useMeta } from "../MetaContext";
import { apiLandingPublishPath, Routes } from "@/lib/constants";

interface RouteInfo {
  path: string;
  landingPageId: string;
  landingPageName: string;
  published: boolean;
}

interface DomainRow {
  id: string;
  domain: string;
  enabled: boolean;
  verified: boolean;
  landing_page_id?: string | null;
  landing_page_name?: string;
  routes?: RouteInfo[];
}

export function PublishDialog({ onClose }: { onClose: () => void }) {
  const { pageId, setStatus, setPublishedDirty, flushSaveRef } = useMeta();
  // domains === null 表示仍在加载：与「确认没有可用域名」区分，避免闪现空态。
  const [domains, setDomains] = useState<DomainRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [domainId, setDomainId] = useState("");
  // 用户输入的路径片段（不含前导斜杠），空串即发布到域名根。
  const [pathInput, setPathInput] = useState("");
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
        // 优先预选当前页已发布到的位置（更新发布不换位），否则取第一个域名的根路径。
        const bound = usable.find((d) => d.routes?.some((r) => r.landingPageId === pageId));
        const preset = bound ?? usable[0];
        if (preset) setDomainId(preset.id);
        const current = bound?.routes?.find((r) => r.landingPageId === pageId);
        if (current) setPathInput(current.path === "/" ? "" : current.path.slice(1));
      } catch {
        setLoadFailed(true);
      }
    })();
  }, [pageId]);

  const selected = domains?.find((d) => d.id === domainId);
  // 与服务端 normalizeRoutePath 同源的前端预览：仅用于展示与占位判断，
  // 真正的校验以服务端为准（前端规则漂移不会放过非法路径）。
  const targetPath = pathInput.trim()
    ? `/${pathInput.trim().toLowerCase().replace(/^\/+|\/+$/g, "")}`
    : "/";
  const pathShapeOk = targetPath === "/" || /^(\/[a-z0-9-]+){1,2}$/.test(targetPath);
  const pathReserved = /^\/(api|_next)(\/|$)/.test(targetPath);
  // 所选位置（域名 + 路径）已在服务另一张页面：发布即顶替，原页面从该位置下线。
  const occupied = selected?.routes?.find(
    (r) => r.path === targetPath && r.landingPageId !== pageId,
  );
  const rebinding = !!occupied;

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
        body: JSON.stringify({ domainId, path: targetPath }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(
          json.error === "validation_failed" ? "页面校验未通过，无法发布"
          : json.error === "domain_required" ? "请选择一个已验证的域名"
          : json.error === "domain_not_verified" ? "所选域名未验证"
          : json.error === "path_invalid" ? "路径格式不合法：只能用小写字母、数字和连字符，最多两级"
          : json.error === "path_reserved" ? "该路径为平台保留，请换一个"
          : json.error === "publish_quota_exceeded"
            ? `已发布 ${json.published ?? ""} 张，达到套餐额度${json.limit ? ` ${json.limit} 张` : ""}。请先取消发布其他页面，或升级套餐。`
          : "发布失败",
        );
        return;
      }
      setLiveUrl(`https://${json.domain}${json.path ?? "/"}`);
      setStatus("published");
      setPublishedDirty(false); // 刚发布：线上快照与草稿一致
    } catch {
      setError("发布失败，请检查网络后重试");
    } finally {
      setBusy(false);
    }
  }

  function domainLabel(d: DomainRow): string {
    const used = d.routes?.length ?? 0;
    if (!used) return d.domain;
    return `${d.domain}（已用 ${used} 个路径）`;
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
            <label className="block text-sm text-ink-soft" htmlFor="publish-path">
              发布路径
            </label>
            <div className="flex items-center gap-1 rounded-md border border-edge bg-canvas px-3 py-2">
              <span className="shrink-0 text-sm text-ink-soft">
                {selected?.domain ?? "yourbrand.com"}/
              </span>
              <input
                id="publish-path"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                placeholder="留空即发布到网站首页"
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60"
              />
            </div>
            <p className="text-xs text-ink-soft">
              可用小写字母、数字和连字符，最多两级，例如 <code>invisalign</code> 或{" "}
              <code>services/whitening</code>。留空表示发布到域名根路径。
            </p>

            {!pathShapeOk && (
              <p className="text-sm text-red-500">
                路径格式不合法：只能用小写字母、数字和连字符，最多两级。
              </p>
            )}
            {pathShapeOk && pathReserved && (
              <p className="text-sm text-red-500">该路径为平台保留，请换一个。</p>
            )}
            {rebinding && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {selected?.domain}{targetPath === "/" ? "" : targetPath} 当前正在服务「{occupied?.landingPageName ?? "其他页面"}」。继续发布会把这个位置改为本页面，原页面将立即从该位置下线（若有广告在投请先确认）。
              </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft">取消</button>
              <button
                onClick={publish}
                disabled={busy || !pathShapeOk || pathReserved}
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
