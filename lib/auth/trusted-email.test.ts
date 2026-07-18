import { describe, it, expect } from "vitest";
import { isTrustedEmail, TRUSTED_DOMAINS } from "./trusted-email";

describe("isTrustedEmail (仅 Gmail)", () => {
  it("接受 Gmail 域名", () => {
    expect(isTrustedEmail("user@gmail.com")).toBe(true);
    expect(isTrustedEmail("user@googlemail.com")).toBe(true);
  });

  it("大小写不敏感", () => {
    expect(isTrustedEmail("User@Gmail.COM")).toBe(true);
  });

  it("拒绝非 Gmail 域名（含此前允许的 Outlook/iCloud/公司域名）", () => {
    expect(isTrustedEmail("user@outlook.com")).toBe(false);
    expect(isTrustedEmail("user@icloud.com")).toBe(false);
    expect(isTrustedEmail("user@zapbridge.com")).toBe(false);
    expect(isTrustedEmail("user@example.com")).toBe(false);
  });

  it("拒绝空值与非法输入", () => {
    expect(isTrustedEmail("")).toBe(false);
    expect(isTrustedEmail(null)).toBe(false);
    expect(isTrustedEmail(undefined)).toBe(false);
    expect(isTrustedEmail("no-at-sign")).toBe(false);
  });

  it("白名单只含 Google 域名", () => {
    expect(TRUSTED_DOMAINS).toEqual(["gmail.com", "googlemail.com"]);
  });
});
