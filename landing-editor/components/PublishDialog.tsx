"use client";
import { useAdminT } from "@/lib/i18n/admin/context";
import { useEffect, useState } from "react";
import { useMeta } from "../MetaContext";
import { apiLandingPublishPath, apiLandingCheckPath, pageCheckReportPath, Routes } from "@/lib/constants";

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
  /** 平台分配的子域：免 DNS 配置，供试用期先跑通链路。 */
  is_platform_subdomain?: boolean;
  landing_page_id?: string | null;
  landing_page_name?: string;
  routes?: RouteInfo[];
}

export function PublishDialog({ onClose }: { onClose: () => void }) {
  const t = useAdminT().editor.publish;
  const { pageId, name, setStatus, setPublishedDirty, flushSaveRef } = useMeta();
  // domains === null 表示仍在加载：与「确认没有可用域名」区分，避免闪现空态。
  const [domains, setDomains] = useState<DomainRow[] | null>(null);
  const [loadFailed, setLoadFailed] = useState(false);
  const [domainId, setDomainId] = useState("");
  // 用户输入的路径片段（不含前导斜杠），空串即发布到域名根。
  const [pathInput, setPathInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  // 平台子域分配中：这是没有自有域名的用户唯一的发布出口，失败必须让他看到原因。
  const [claiming, setClaiming] = useState(false);
  // 发布后的自检（抓取线上页，慢，必须有进行中反馈）
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  /** 对刚发布的这张页跑一次自检，报告在新标签打开。 */
  async function runCheck() {
    setChecking(true);
    setCheckError("");
    try {
      const res = await fetch(apiLandingCheckPath(pageId), { method: "POST" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setCheckError(
          res.status === 429 ? t.checkRateLimited
            : body.error === "check_failed" ? t.checkFetchFailed
            : t.checkFailed,
        );
        return;
      }
      const { id } = await res.json();
      window.open(pageCheckReportPath(id), "_blank", "noopener");
    } catch {
      setCheckError(t.checkNetworkFailed);
    } finally {
      setChecking(false);
    }
  }

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
        setError(t.errors.draftSave);
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
          json.error === "validation_failed" ? t.errors.validation
          : json.error === "domain_required" ? t.errors.domainRequired
          : json.error === "domain_not_verified" ? t.errors.domainNotVerified
          : json.error === "path_invalid" ? t.errors.pathInvalid
          : json.error === "path_reserved" ? t.errors.pathReserved
          : json.error === "publish_quota_exceeded"
            ? t.errors.quota(String(json.published ?? ""), json.limit ? t.errors.quotaLimit(String(json.limit)) : "")
          : t.errors.generic,
        );
        return;
      }
      setLiveUrl(`https://${json.domain}${json.path ?? "/"}`);
      setStatus("published");
      setPublishedDirty(false); // 刚发布：线上快照与草稿一致
    } catch {
      setError(t.errors.network);
    } finally {
      setBusy(false);
    }
  }

  function domainLabel(d: DomainRow): string {
    const used = d.routes?.length ?? 0;
    const suffix = d.is_platform_subdomain ? t.platformSuffix : "";
    if (!used) return `${d.domain}${suffix}`;
    return `${d.domain}${suffix}${t.pathsUsed(used)}`;
  }

  /**
   * 领取平台子域：没有自有域名的用户由此拿到一个可立即发布的地址，
   * 不必先去买域名、改 DNS、等验证。领取后重新拉列表并预选它。
   */
  async function claimSubdomain() {
    if (claiming) return;
    setClaiming(true);
    setError("");
    try {
      const res = await fetch("/api/domains/platform-subdomain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fromTitle: name ?? "" }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        setError(
          json?.error === "subdomain_unavailable"
            ? t.claimUnavailable
            : t.claimFailed,
        );
        return;
      }
      const listRes = await fetch("/api/domains");
      if (!listRes.ok) throw new Error(`HTTP ${listRes.status}`);
      const all: DomainRow[] = await listRes.json();
      const usable = all.filter((d) => d.enabled && d.verified);
      setDomains(usable);
      const mine = usable.find((d) => d.id === json?.id) ?? usable[0];
      if (mine) setDomainId(mine.id);
    } catch {
      setError(t.claimNetworkFailed);
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[420px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">{t.title}</h2>

        {liveUrl ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-ink-soft">{t.publishedLabel}</p>
            <a href={liveUrl} target="_blank" className="block break-all text-brand-600 hover:underline">{liveUrl}</a>
            {/* 刚上线、还没开始投是自检最该发生的时刻，故把入口放在这里而不是只留在列表页 */}
            <p className="text-xs text-ink-muted">{t.checkHint}</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => void runCheck()}
                disabled={checking}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {checking ? t.checking : t.check}
              </button>
              <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink hover:bg-canvas">{t.done}</button>
            </div>
            {checkError && <p className="text-sm text-red-500">{checkError}</p>}
          </div>
        ) : loadFailed ? (
          <div className="mt-4 space-y-3 text-sm text-ink-soft">
            <p>{t.domainsLoadFailed}</p>
            <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-ink hover:bg-canvas">{t.close}</button>
          </div>
        ) : domains === null ? (
          <p className="mt-4 text-sm text-ink-soft">{t.domainsLoading}</p>
        ) : domains.length === 0 ? (
          <div className="mt-4 space-y-3 text-sm text-ink-soft">
            <p>{t.noDomains}</p>
            <button
              onClick={() => void claimSubdomain()}
              disabled={claiming}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {claiming ? t.claiming : t.claim}
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-ink-soft">
              {t.claimHint}
            </p>
            <a href={Routes.Domains} className="inline-block rounded-md border border-edge px-3 py-1.5 text-ink hover:bg-canvas">
              {t.connectOwnDomain}
            </a>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <label className="block text-sm text-ink-soft">{t.selectDomain}</label>
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
              {t.path}
            </label>
            <div className="flex items-center gap-1 rounded-md border border-edge bg-canvas px-3 py-2">
              <span className="shrink-0 text-sm text-ink-soft">
                {selected?.domain ?? "yourbrand.com"}/
              </span>
              <input
                id="publish-path"
                value={pathInput}
                onChange={(e) => setPathInput(e.target.value)}
                placeholder={t.pathPlaceholder}
                className="w-full bg-transparent text-sm text-ink outline-none placeholder:text-ink-soft/60"
              />
            </div>
            <p className="text-xs text-ink-soft">
              {t.pathHint[0]}<code>invisalign</code>{t.pathHint[1]}<code>services/whitening</code>{t.pathHint[2]}
            </p>

            {!pathShapeOk && (
              <p className="text-sm text-red-500">
                {t.pathInvalid}
              </p>
            )}
            {pathShapeOk && pathReserved && (
              <p className="text-sm text-red-500">{t.pathReserved}</p>
            )}
            {/*
              域名一致性：Google 与 LinkedIn 都要求广告的展示 URL 域名与最终落地域名
              一致。用平台子域发布本身没问题（展示 URL 就是这个子域），但客户很容易
              在广告里把展示 URL 填成自己的品牌域 —— 那是直接违规，而且被拒时给出的
              理由通常看不出是这个原因。发布前说一句，比事后猜三次便宜。
            */}
            {selected?.is_platform_subdomain && (
              <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
                {t.displayUrlWarning}
              </p>
            )}
            {rebinding && (
              <p className="rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-700">
                {t.rebindWarning(
                  `${selected?.domain ?? ""}${targetPath === "/" ? "" : targetPath}`,
                  occupied?.landingPageName ?? t.fallbackPageName,
                )}
              </p>
            )}
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink-soft">{t.cancel}</button>
              <button
                onClick={publish}
                disabled={busy || !pathShapeOk || pathReserved}
                className={`rounded-md px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60 ${rebinding ? "bg-amber-600 hover:bg-amber-700" : "bg-brand-600 hover:bg-brand-700"}`}
              >
                {busy ? t.publishing : rebinding ? t.rebind : t.confirm}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
