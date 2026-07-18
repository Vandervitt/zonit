import { describe, it, expect, vi } from "vitest";
import { deliverOne, type DeliveryDeps } from "./dispatch";
import { verifyWebhookSignature } from "./sign";
import type { WebhookDeliveryRow } from "./deliveries-store";

const row: WebhookDeliveryRow = {
  id: "d1", user_id: "u1", page_id: "p1",
  payload: { event: "lead.created" }, status: "pending", attempts: 0,
};

function deps(over: Partial<DeliveryDeps> = {}): DeliveryDeps {
  return {
    getTarget: async () => ({ url: "https://hook.example.com", secret: "whsec", enabled: true }),
    post: async () => ({ ok: true }),
    markSent: vi.fn(async () => {}),
    markFailure: vi.fn(async () => {}),
    ...over,
  };
}

describe("deliverOne", () => {
  it("成功投递 → markSent，带正确签名头", async () => {
    let seen: { url: string; body: string; signature: string } | null = null;
    const d = deps({ post: async (url, body, signature) => { seen = { url, body, signature }; return { ok: true }; } });
    await deliverOne(row, d);
    expect(d.markSent).toHaveBeenCalledWith("d1");
    expect(d.markFailure).not.toHaveBeenCalled();
    expect(seen!.url).toBe("https://hook.example.com");
    expect(verifyWebhookSignature(seen!.body, seen!.signature, "whsec")).toBe(true);
  });

  it("目标未配置/关闭 → markFailure(no_target)，不 POST", async () => {
    const post = vi.fn(async () => ({ ok: true }));
    const d = deps({ getTarget: async () => null, post });
    await deliverOne(row, d);
    expect(post).not.toHaveBeenCalled();
    expect(d.markFailure).toHaveBeenCalledWith("d1", 0, "no_target");
  });

  it("POST 失败 → markFailure 记录 attempts 与错误", async () => {
    const d = deps({ post: async () => ({ ok: false, error: "http_500" }) });
    await deliverOne(row, d);
    expect(d.markFailure).toHaveBeenCalledWith("d1", 0, "http_500");
    expect(d.markSent).not.toHaveBeenCalled();
  });
});
