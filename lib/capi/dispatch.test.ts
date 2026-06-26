import { describe, it, expect, vi } from "vitest";
import { flushOne, type FlushDeps } from "./dispatch";
import type { CapiEventRow } from "./events-store";

const row: CapiEventRow = {
  id: "1", page_id: "p1", provider: "meta", event_name: "Lead", event_id: "e1",
  payload: { eventName: "Lead", eventId: "e1", emailHash: "h", eventTime: 1700000000 },
  status: "pending", attempts: 0,
};

function deps(over: Partial<FlushDeps>): FlushDeps {
  return {
    getCredentials: async () => [{ provider: "meta", accessToken: "t", externalId: "d" }],
    send: async () => ({ ok: true }),
    markSent: async () => {},
    markFailure: async () => {},
    ...over,
  };
}

describe("flushOne", () => {
  it("发送成功 → markSent", async () => {
    const markSent = vi.fn(async () => {});
    await flushOne(row, deps({ markSent }));
    expect(markSent).toHaveBeenCalledWith("1");
  });
  it("无凭据 → markFailure", async () => {
    const markFailure = vi.fn(async () => {});
    await flushOne(row, deps({ getCredentials: async () => [], markFailure }));
    expect(markFailure).toHaveBeenCalled();
  });
  it("发送失败 → markFailure 带 attempts", async () => {
    const markFailure = vi.fn(async () => {});
    await flushOne(row, deps({ send: async () => ({ ok: false, error: "boom" }), markFailure }));
    expect(markFailure).toHaveBeenCalledWith("1", 0, expect.stringContaining("boom"));
  });
});
