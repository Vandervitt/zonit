// landing-renderer/tracking/TrackingProvider.tsx
"use client";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Script from "next/script";
import type { PageTracking } from "@/types/schema.draft";
import { parseUtm, mergeUtmIntoUrl } from "./utm";
import { PixelSink, BeaconSink, type EventSink } from "./sinks";
import { inferChannel } from "./events";
import { ConsentBar } from "./ConsentBar";

const CONSENT_KEY = "lp_consent";
const UTM_KEY = "lp_utm";

export function TrackingProvider({ tracking, pageId, children }: { tracking?: PageTracking; pageId: string; children: ReactNode }) {
  const consentEnabled = tracking?.consent?.enabled ?? true;
  // SSR 与首帧统一为「未同意/未拒绝」，再由 effect 读 localStorage 校正，避免水合不一致与 SSR 访问 localStorage。
  const [consented, setConsented] = useState<boolean>(false);
  const [declined, setDeclined] = useState<boolean>(false);
  const utmRef = useRef<Record<string, string>>({});
  const sinksRef = useRef<EventSink[]>([]);
  const beaconRef = useRef<BeaconSink | null>(null);

  const enabledPixels = (tracking?.pixels ?? []).filter((p) => p.enabled && p.id.trim());

  // 捕获 UTM（一次）
  useEffect(() => {
    const utm = parseUtm(window.location.search);
    if (Object.keys(utm).length) sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    try { utmRef.current = JSON.parse(sessionStorage.getItem(UTM_KEY) ?? "{}"); } catch { utmRef.current = {}; }
  }, []);

  // first-party beacon：独立于同意条，mount 即发 page_view（始终采集，匿名无 cookie）。
  useEffect(() => {
    if (beaconRef.current) return;
    beaconRef.current = new BeaconSink(pageId);
    beaconRef.current.track("page_view", { ...utmRef.current });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 读已存同意（仅客户端）：未启用同意条则视为已同意；否则按 localStorage 校正。
  useEffect(() => {
    if (!consentEnabled) { setConsented(true); return; }
    const v = localStorage.getItem(CONSENT_KEY);
    if (v === "accepted") setConsented(true);
    else if (v === "declined") setDeclined(true);
  }, [consentEnabled]);

  // 同意后：建 sink，待第三方 SDK（next/script 异步注入）就绪再 init + 发 page_view。
  // 轮询避免 effect 早于注入脚本执行导致首个 page_view 丢失；最长约 5s 兜底。
  // 注：本组件假定 tracking 不可变（已发布页数据），故 enabledPixels 不随渲染变化。
  useEffect(() => {
    if (!consented || sinksRef.current.length) return;
    sinksRef.current = enabledPixels.map((p) => new PixelSink(p));
    const fire = () => {
      sinksRef.current.forEach((s) => s.init());
      sinksRef.current.forEach((s) => s.track("page_view", { ...utmRef.current }));
    };
    let tries = 0;
    const timer = setInterval(() => {
      if (sinksRef.current.every((s) => s.ready()) || ++tries > 50) {
        clearInterval(timer);
        fire();
      }
    }, 100);
    return () => clearInterval(timer);
    // enabledPixels 取自不可变 props，consented 变 true 时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [consented]);

  // CTA 委托点击
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    const target = (e.target as HTMLElement).closest("a[data-cta]") as HTMLAnchorElement | null;
    if (!target) return;
    const channel = target.getAttribute("data-cta") ?? "external";
    sinksRef.current.forEach((s) => s.track("cta_click", { channel, ...utmRef.current }));
    beaconRef.current?.track("cta_click", { channel, ...utmRef.current });
    if (tracking?.utmPassthrough && inferChannel(target.href) === "external") {
      const merged = mergeUtmIntoUrl(target.href, utmRef.current);
      if (merged !== target.href) { e.preventDefault(); window.location.href = merged; }
    }
  }, [tracking?.utmPassthrough]);

  const accept = () => { localStorage.setItem(CONSENT_KEY, "accepted"); setConsented(true); };
  const decline = () => { localStorage.setItem(CONSENT_KEY, "declined"); setDeclined(true); };

  return (
    <div onClickCapture={onClickCapture}>
      {consented && enabledPixels.map((p) => <PixelScript key={p.provider} provider={p.provider} id={p.id} />)}
      {children}
      {consentEnabled && !consented && !declined && (
        <ConsentBar text={tracking?.consent.text} onAccept={accept} onDecline={decline} />
      )}
    </div>
  );
}

/** 按平台注入官方 SDK（同意后才渲染）。 */
function PixelScript({ provider, id }: { provider: string; id: string }) {
  if (provider === "meta") {
    return (
      <Script id={`px-meta-${id}`} strategy="afterInteractive">{`
        !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
      `}</Script>
    );
  }
  if (provider === "ga4" || provider === "googleAds") {
    // 固定 id 让 GA4 与 Google Ads 同时启用时共用同一份 gtag 加载器与初始化（Next 按 id 去重）；
    // 各自的 config(id) 由对应 PixelSink.init 下发，互不影响。
    return (
      <>
        <Script id="gtag-loader" src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">{`
          window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=window.gtag||gtag;gtag('js',new Date());
        `}</Script>
      </>
    );
  }
  if (provider === "tiktok") {
    return (
      <Script id={`px-tt-${id}`} strategy="afterInteractive">{`
        !function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];
        ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
        ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};
        ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};
        var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
        }(window,document,'ttq');
      `}</Script>
    );
  }
  return null;
}
