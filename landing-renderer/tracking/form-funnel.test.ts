// 表单漏斗事件的上报口径：事件名与 detail 必须原样落到 /api/track 的载荷里，
// 否则后台看到的漏斗与实际不符（比看不到更糟）。
import { afterEach, describe, expect, it, vi } from "vitest";
import { BeaconSink } from "./sinks";

function trackAndCapture(event: Parameters<BeaconSink["track"]>[0], params: Record<string, string>) {
  const bodies: string[] = [];
  vi.stubGlobal("navigator", {}); // 无 sendBeacon → 走 fetch 兜底
  vi.stubGlobal("fetch", (_url: string, init: { body: string }) => {
    bodies.push(init.body);
    return Promise.resolve(new Response(null, { status: 204 }));
  });
  new BeaconSink("page-1").track(event, params);
  return JSON.parse(bodies[0]);
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("BeaconSink 表单漏斗事件", () => {
  it("form_start 原样上报，不带 detail", () => {
    const payload = trackAndCapture("form_start", { utm_source: "fb" });
    expect(payload).toMatchObject({ pageId: "page-1", event: "form_start", utm_source: "fb" });
    expect(payload.detail).toBeUndefined();
  });

  it("form_submit 原样上报", () => {
    expect(trackAndCapture("form_submit", {}).event).toBe("form_submit");
  });

  it("form_error 带错误码——占比高的码指向卡住访客的字段", () => {
    const payload = trackAndCapture("form_error", { detail: "bad_whatsapp" });
    expect(payload).toMatchObject({ event: "form_error", detail: "bad_whatsapp" });
  });
});
