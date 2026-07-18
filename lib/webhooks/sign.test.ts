import { describe, it, expect } from "vitest";
import { signWebhookBody, verifyWebhookSignature } from "./sign";

const secret = "whsec_test";
const body = JSON.stringify({ event: "lead.created", id: "1" });

describe("webhook 签名", () => {
  it("签名格式为 sha256=<hex64>", () => {
    const sig = signWebhookBody(body, secret);
    expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/);
  });
  it("同输入稳定、同密钥可校验", () => {
    const sig = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(body, sig, secret)).toBe(true);
  });
  it("改 body 校验失败", () => {
    const sig = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(body + " ", sig, secret)).toBe(false);
  });
  it("换密钥校验失败", () => {
    const sig = signWebhookBody(body, secret);
    expect(verifyWebhookSignature(body, sig, "other")).toBe(false);
  });
  it("畸形签名不抛错，返回 false", () => {
    expect(verifyWebhookSignature(body, "garbage", secret)).toBe(false);
    expect(verifyWebhookSignature(body, "sha256=zz", secret)).toBe(false);
  });
});
