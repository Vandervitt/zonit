// 出站 webhook 签名：X-Zonit-Signature: sha256=<hmac-hex>。镜像 lemonsqueezy 入站校验习惯。
import { createHmac, timingSafeEqual } from "node:crypto";

export function signWebhookBody(rawBody: string, secret: string): string {
  const hex = createHmac("sha256", secret).update(rawBody).digest("hex");
  return `sha256=${hex}`;
}

export function verifyWebhookSignature(rawBody: string, signature: string, secret: string): boolean {
  if (!signature.startsWith("sha256=")) return false;
  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  const a = Buffer.from(signature.slice("sha256=".length), "hex");
  const b = Buffer.from(expected, "hex");
  if (a.length !== b.length || a.length === 0) return false;
  return timingSafeEqual(a, b);
}
