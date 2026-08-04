"use client";
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
          res.status === 429 ? "自检次数已达上限，请稍后再试"
            : body.error === "check_failed" ? "抓取页面失败，请确认线上地址已生效"
            : "自检失败，请稍后重试",
        );
        return;
      }
      const { id } = await res.json();
      window.open(pageCheckReportPath(id), "_blank", "noopener");
    } catch {
      setCheckError("自检失败，请检查网络后重试。");
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
    const suffix = d.is_platform_subdomain ? "（平台提供）" : "";
    if (!used) return `${d.domain}${suffix}`;
    return `${d.domain}${suffix}（已用 ${used} 个路径）`;
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
            ? "平台地址暂时无法分配，请稍后重试或绑定自有域名。"
            : "领取失败，请稍后重试。",
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
      setError("领取失败，请检查网络后重试。");
    } finally {
      setClaiming(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[420px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">发布页面</h2>

        {liveUrl ? (
          <div className="mt-4 space-y-3 text-sm">
            <p className="text-ink-soft">已发布，对外链接：</p>
            <a href={liveUrl} target="_blank" className="block break-all text-brand-600 hover:underline">{liveUrl}</a>
            {/* 刚上线、还没开始投是自检最该发生的时刻，故把入口放在这里而不是只留在列表页 */}
            <p className="text-xs text-ink-muted">投放前先跑一次自检，看看审核常盯的几项在这张页上是什么情况。</p>
            <div className="mt-2 flex items-center gap-2">
              <button
                onClick={() => void runCheck()}
                disabled={checking}
                className="rounded-md bg-brand-600 px-3 py-1.5 text-sm text-white hover:bg-brand-700 disabled:opacity-60"
              >
                {checking ? "自检中…" : "投放前自检"}
              </button>
              <button onClick={onClose} className="rounded-md border border-edge px-3 py-1.5 text-sm text-ink hover:bg-canvas">完成</button>
            </div>
            {checkError && <p className="text-sm text-red-500">{checkError}</p>}
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
            <p>你还没有可发布的域名。可以先用平台提供的地址把页面发出去，收到线索后再换成自己的品牌域名。</p>
            <button
              onClick={() => void claimSubdomain()}
              disabled={claiming}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {claiming ? "正在分配…" : "用平台提供的地址发布"}
            </button>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <p className="text-xs text-ink-soft">
              平台会按页面名分配一个专属地址，无需配置 DNS，立即可用。
              页面随时可以改发到自有域名。
            </p>
            <a href={Routes.Domains} className="inline-block rounded-md border border-edge px-3 py-1.5 text-ink hover:bg-canvas">
              绑定自有域名
            </a>
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
            {/*
              域名一致性：Google 与 LinkedIn 都要求广告的展示 URL 域名与最终落地域名
              一致。用平台子域发布本身没问题（展示 URL 就是这个子域），但客户很容易
              在广告里把展示 URL 填成自己的品牌域 —— 那是直接违规，而且被拒时给出的
              理由通常看不出是这个原因。发布前说一句，比事后猜三次便宜。
            */}
            {selected?.is_platform_subdomain && (
              <p className="rounded-md bg-sky-50 px-3 py-2 text-xs text-sky-800">
                这是平台提供的地址。在 Google Ads 与 LinkedIn 投放时，广告的展示 URL
                域名必须与实际落地域名一致 —— 填成自己的品牌域会违规。要在广告里露出品牌域，
                请先绑定自有域名再发布。
              </p>
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
