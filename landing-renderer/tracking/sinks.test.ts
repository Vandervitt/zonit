// BeaconSink 上报 URL 回归：必须是同源相对路径。
// 历史两次故障都源于打绝对 URL——base 尾斜杠导致每个事件吃一次 308（sendBeacon
// 跟随重定向有丢数据风险），以及跨源请求被拦截器掐断成 ERR_CONNECTION_RESET。
// 租户自有域名下 /api/track 由 tenant-proxy 白名单直通，相对路径始终可达。
import { afterEach, describe, expect, it, vi } from "vitest";
import { BeaconSink } from "./sinks";

function trackWithBase(base: string): string {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", base);
  const calls: string[] = [];
  vi.stubGlobal("navigator", {}); // 无 sendBeacon → 走 fetch 兜底
  vi.stubGlobal("fetch", (url: string) => {
    calls.push(url);
    return Promise.resolve(new Response(null, { status: 204 }));
  });
  new BeaconSink("page-1").track("page_view", {});
  return calls[0];
}

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("BeaconSink 上报 URL", () => {
  it("不受 NEXT_PUBLIC_APP_URL 影响，恒为同源相对路径", () => {
    expect(trackWithBase("https://zapbridge.tech/")).toBe("/api/track");
    expect(trackWithBase("https://zapbridge.tech")).toBe("/api/track");
    expect(trackWithBase("")).toBe("/api/track");
  });
});
