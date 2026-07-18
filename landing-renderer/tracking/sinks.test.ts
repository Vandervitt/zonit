// BeaconSink 上报 URL 回归：NEXT_PUBLIC_APP_URL 尾部带斜杠时不得产生 `//api/track`
//（生产曾因此每个事件都吃一次 308 重定向，sendBeacon 跟随重定向存在丢数据风险）。
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
  it("base 尾部带斜杠：归一化为单斜杠", () => {
    expect(trackWithBase("https://zapbridge.tech/")).toBe("https://zapbridge.tech/api/track");
  });

  it("base 不带斜杠：原样拼接", () => {
    expect(trackWithBase("https://zapbridge.tech")).toBe("https://zapbridge.tech/api/track");
  });

  it("base 为空：退化为相对路径", () => {
    expect(trackWithBase("")).toBe("/api/track");
  });
});
