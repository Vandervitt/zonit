// 草稿分享预览的签名 token。
// token = `${pageId}.${exp}.${sig}`，sig = base64url(HMAC-SHA256(AUTH_SECRET, `${pageId}.${exp}.${previewSecret}`))。
// AUTH_SECRET 防伪造；per-page previewSecret 提供撤销（轮换即失效）；exp 提供过期。
import { createHmac, timingSafeEqual } from "node:crypto";

function b64url(buf: Buffer): string {
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function sign(pageId: string, exp: number, previewSecret: string, authSecret: string): string {
  const mac = createHmac("sha256", authSecret).update(`${pageId}.${exp}.${previewSecret}`).digest();
  return b64url(mac);
}

export function signPreviewToken(args: {
  pageId: string;
  expMs: number;
  previewSecret: string;
  authSecret: string;
}): string {
  const { pageId, expMs, previewSecret, authSecret } = args;
  return `${pageId}.${expMs}.${sign(pageId, expMs, previewSecret, authSecret)}`;
}

/** 仅结构解析出 pageId（不校验签名），供预览路由先查库拿 previewSecret。非法返回 null。 */
export function decodePageId(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[0]) return null;
  return parts[0];
}

/** 校验签名 + 过期。通过返回 { pageId }，否则 null。 */
export function verifyPreviewToken(args: {
  token: string;
  previewSecret: string;
  authSecret: string;
  nowMs: number;
}): { pageId: string } | null {
  const { token, previewSecret, authSecret, nowMs } = args;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [pageId, expStr, sig] = parts;
  const exp = Number(expStr);
  if (!pageId || !Number.isFinite(exp) || exp <= nowMs) return null;

  const expected = sign(pageId, exp, previewSecret, authSecret);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return { pageId };
}
