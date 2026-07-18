import { describe, it, expect } from "vitest";
import { signPreviewToken, verifyPreviewToken, decodePageId } from "./token";

const authSecret = "test-auth-secret";
const previewSecret = "page-secret-abc";
const pageId = "a319f808-7d6f-430d-b5d2-a0736a30146d";
const now = 1_000_000_000_000;

function makeToken(overrides: Partial<{ expMs: number; previewSecret: string }> = {}) {
  return signPreviewToken({
    pageId,
    expMs: overrides.expMs ?? now + 7 * 24 * 3600 * 1000,
    previewSecret: overrides.previewSecret ?? previewSecret,
    authSecret,
  });
}

describe("preview token", () => {
  it("签发→校验往返成功，返回 pageId", () => {
    const t = makeToken();
    expect(verifyPreviewToken({ token: t, previewSecret, authSecret, nowMs: now })).toEqual({ pageId });
  });

  it("过期 token 校验失败", () => {
    const t = makeToken({ expMs: now - 1 });
    expect(verifyPreviewToken({ token: t, previewSecret, authSecret, nowMs: now })).toBeNull();
  });

  it("preview_secret 轮换后旧 token 失效（撤销语义）", () => {
    const t = makeToken({ previewSecret: "old-secret" });
    expect(verifyPreviewToken({ token: t, previewSecret: "new-secret", authSecret, nowMs: now })).toBeNull();
  });

  it("篡改签名（错误 AUTH_SECRET）校验失败", () => {
    const t = makeToken();
    expect(verifyPreviewToken({ token: t, previewSecret, authSecret: "wrong", nowMs: now })).toBeNull();
  });

  it("篡改 pageId 后签名不匹配", () => {
    const t = makeToken();
    const tampered = "b0000000-0000-0000-0000-000000000000" + t.slice(t.indexOf("."));
    expect(verifyPreviewToken({ token: tampered, previewSecret, authSecret, nowMs: now })).toBeNull();
  });

  it("decodePageId 不校验签名，仅解出 pageId 供查库", () => {
    const t = makeToken();
    expect(decodePageId(t)).toBe(pageId);
  });

  it("格式非法（缺段）返回 null", () => {
    expect(verifyPreviewToken({ token: "garbage", previewSecret, authSecret, nowMs: now })).toBeNull();
    expect(decodePageId("garbage")).toBeNull();
  });
});
