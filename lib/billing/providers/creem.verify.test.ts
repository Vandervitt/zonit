import { describe, it, expect, beforeEach, afterEach } from "vitest";
import crypto from "crypto";
import { creemProvider } from "./creem";

const SECRET = "whsec_test_secret";

function sign(body: string): string {
  return crypto.createHmac("sha256", SECRET).update(body).digest("hex");
}

const env = process.env;
beforeEach(() => {
  process.env = { ...env, CREEM_WEBHOOK_SECRET: SECRET, CREEM_PRODUCT_PRO: "prod_pro" };
});
afterEach(() => {
  process.env = env;
});

describe("creemProvider.verifyAndParse — HMAC 验签", () => {
  const body = JSON.stringify({
    eventType: "subscription.active",
    object: {
      id: "sub_1",
      product: { id: "prod_pro" },
      customer: { id: "cust_1" },
      metadata: { user_id: "u1" },
    },
  });

  it("合法签名 → 验签通过并解析出规范化事件", async () => {
    const event = await creemProvider.verifyAndParse(body, { "creem-signature": sign(body) });
    expect(event).toMatchObject({ kind: "subscription_activated", userId: "u1", plan: "pro" });
  });

  it("签名错误 → 抛错", async () => {
    await expect(
      creemProvider.verifyAndParse(body, { "creem-signature": sign(body + "tampered") }),
    ).rejects.toThrow(/signature/i);
  });

  it("缺签名头 → 抛错", async () => {
    await expect(creemProvider.verifyAndParse(body, {})).rejects.toThrow(/signature/i);
  });
});
