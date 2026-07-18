import { describe, it, expect } from "vitest";
import { buildLeadWebhookPayload } from "./webhook-payload";

describe("buildLeadWebhookPayload", () => {
  const input = {
    pageId: "p1", pageName: "牙科落地页",
    fields: { name: "Sara", email: "s@x.com", phone: "+66" },
    channel: "form",
    utm: { utm_source: "meta", utm_medium: "cpc", utm_campaign: "jul" },
    createdAt: "2026-07-19T00:00:00.000Z",
  };
  it("产出稳定契约字段", () => {
    expect(buildLeadWebhookPayload(input)).toEqual({
      event: "lead.created",
      created_at: "2026-07-19T00:00:00.000Z",
      page: { id: "p1", name: "牙科落地页" },
      channel: "form",
      fields: { name: "Sara", email: "s@x.com", phone: "+66" },
      utm: { source: "meta", medium: "cpc", campaign: "jul" },
    });
  });
  it("缺失 utm/channel 用 null 占位，不抛错", () => {
    const out = buildLeadWebhookPayload({ ...input, channel: null, utm: {} });
    expect(out.channel).toBeNull();
    expect(out.utm).toEqual({ source: null, medium: null, campaign: null });
  });
});
