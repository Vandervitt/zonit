// landing-renderer/tracking/sinks.ts
// 事件 sink 抽象：统一 init/track 接口，TrackingProvider 广播事件给所有 sink。
// 首刀只实现 PixelSink；first-party 采集 sink 留作后续刀（见文件尾）。
import type { PixelConfig } from "@/types/schema.draft";
import { EVENT_MAP, type FirstPartyEvent, type InternalEvent } from "./events";

/** 埋点上报端点（同源相对路径，见 BeaconSink）。 */
export const TRACK_PATH = "/api/track";

export type EventParams = Record<string, string>;

export interface EventSink {
  /** 底层 SDK 是否就绪可接收事件（first-party sink 恒为 true）。 */
  ready(): boolean;
  init(): void;
  track(event: InternalEvent, params: EventParams): void;
}

// 各平台全局对象的最小类型声明
type Fbq = (...args: unknown[]) => void;
type Gtag = (...args: unknown[]) => void;
interface Ttq { load(id: string): void; page(): void; track(name: string, params?: EventParams): void; }
declare global {
  interface Window { fbq?: Fbq; gtag?: Gtag; ttq?: Ttq; dataLayer?: unknown[]; }
}

/** 单平台 Pixel sink：假定对应 SDK 已由 TrackingProvider 注入到 window。 */
export class PixelSink implements EventSink {
  constructor(private readonly config: PixelConfig) {}

  /** 对应平台的全局对象是否已由注入脚本定义（含其 stub）。 */
  ready(): boolean {
    const { provider } = this.config;
    if (provider === "meta") return typeof window.fbq === "function";
    if (provider === "ga4" || provider === "googleAds") return typeof window.gtag === "function";
    if (provider === "tiktok") return !!window.ttq;
    return true;
  }

  init(): void {
    const { provider, id } = this.config;
    if (provider === "meta") window.fbq?.("init", id);
    if (provider === "ga4" || provider === "googleAds") window.gtag?.("config", id);
    if (provider === "tiktok") window.ttq?.load(id);
  }

  track(event: InternalEvent, params: EventParams): void {
    const { provider, id } = this.config;
    const name = EVENT_MAP[provider][event];
    if (provider === "meta") {
      window.fbq?.("track", name, params);
    } else if (provider === "ga4") {
      window.gtag?.("event", name, params);
    } else if (provider === "googleAds") {
      window.gtag?.("event", name, { send_to: id, ...params });
    } else if (provider === "tiktok") {
      if (event === "page_view") window.ttq?.page();
      else window.ttq?.track(name, params);
    }
  }
}

/** first-party 采集 sink：匿名事件回传 Zap Bridge，独立于第三方像素与同意条。 */
export class BeaconSink implements EventSink {
  /**
   * 一律走同源相对路径：租户自有域名下 /api/track 由 tenant-proxy 白名单直通
   * （见 PUBLIC_TENANT_API_PATHS），无需再打到 app 主域。改绝对 URL 会退化成
   * 跨源请求，既容易被拦截器按第三方请求掐断（ERR_CONNECTION_RESET），
   * 也会因 base 尾斜杠等配置问题吃 308——两类历史故障都由此而来。
   */
  private readonly url = TRACK_PATH;
  constructor(private readonly pageId: string) {}
  ready(): boolean { return true; }
  init(): void {}
  /** 第一方 sink 比 pixel 多收表单漏斗事件（见 FirstPartyEvent）。 */
  track(event: FirstPartyEvent, params: EventParams): void {
    const payload = JSON.stringify({
      pageId: this.pageId,
      event,
      channel: params.channel,
      detail: params.detail,
      utm_source: params.utm_source,
      utm_medium: params.utm_medium,
      utm_campaign: params.utm_campaign,
      // term/content 是「哪个创意、哪个关键词」那一层，缺了它归因只能到渠道级。
      // 点击 ID 刻意不随曝光流水上报（见 migrations/043 的取舍说明）。
      utm_term: params.utm_term,
      utm_content: params.utm_content,
    });
    try {
      const blob = new Blob([payload], { type: "text/plain" });
      if (typeof navigator !== "undefined" && navigator.sendBeacon) {
        navigator.sendBeacon(this.url, blob);
      } else {
        void fetch(this.url, { method: "POST", body: payload, keepalive: true, headers: { "Content-Type": "text/plain" } });
      }
    } catch {
      /* best-effort：采集失败不影响落地页 */
    }
  }
}
