import { describe, it, expect } from "vitest";
import { metaProvider } from "./meta";
import { tiktokProvider } from "./tiktok";
import { getProvider } from "./index";
import type { CapiEvent, CapiCredential } from "../types";

const ev: CapiEvent = {
  eventName: "Lead", eventId: "evt-1",
  emailHash: "e_hash", phoneHash: "p_hash",
  fbp: "fb.1.1.1", fbc: "fbc.1", clientIp: "1.2.3.4", userAgent: "UA",
  eventTime: 1700000000, sourceUrl: "https://x.com/p",
};
const cred: CapiCredential = { provider: "meta", accessToken: "tok", externalId: "ds1" };

describe("metaProvider.buildPayload", () => {
  it("结构含 data[0] + 哈希 user_data + event_id，省略空字段", () => {
    const b = metaProvider.buildPayload(ev, cred) as { data: { event_name: string; event_id: string; action_source: string; user_data: Record<string, unknown> }[] };
    expect(b.data[0].event_name).toBe("Lead");
    expect(b.data[0].event_id).toBe("evt-1");
    expect(b.data[0].action_source).toBe("website");
    expect(b.data[0].user_data.em).toEqual(["e_hash"]);
    expect(b.data[0].user_data.ph).toEqual(["p_hash"]);
    expect(b.data[0].user_data.fbp).toBe("fb.1.1.1");
    expect(b.data[0].user_data.client_ip_address).toBe("1.2.3.4");
  });
  it("无 emailHash 时不含 em", () => {
    const b = metaProvider.buildPayload({ ...ev, emailHash: undefined }, cred) as { data: { user_data: Record<string, unknown> }[] };
    expect(b.data[0].user_data.em).toBeUndefined();
  });
});

describe("tiktokProvider.buildPayload", () => {
  it("结构含 event_source/data + 哈希 user + event_id", () => {
    const c: CapiCredential = { provider: "tiktok", accessToken: "t", externalId: "pix1" };
    const e: CapiEvent = { ...ev, eventName: "SubmitForm", ttp: "ttp1", ttclid: "ttc1" };
    const b = tiktokProvider.buildPayload(e, c) as { event_source: string; event_source_id: string; data: { event: string; event_id: string; user: Record<string, unknown> }[] };
    expect(b.event_source).toBe("web");
    expect(b.event_source_id).toBe("pix1");
    expect(b.data[0].event).toBe("SubmitForm");
    expect(b.data[0].event_id).toBe("evt-1");
    expect(b.data[0].user.email).toEqual(["e_hash"]);
    expect(b.data[0].user.ttp).toBe("ttp1");
  });
});

describe("getProvider", () => {
  it("按 id 取适配器", () => {
    expect(getProvider("meta").id).toBe("meta");
    expect(getProvider("tiktok").id).toBe("tiktok");
  });
});
