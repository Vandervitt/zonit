import { describe, it, expect } from "vitest";
import { normalizeInviteEmails, resolveLinkHours, DEFAULT_LINK_HOURS } from "./normalize";

describe("normalizeInviteEmails", () => {
  it("接受数组，归一化大小写与空白", () => {
    const { emails, skipped } = normalizeInviteEmails([" A@B.com ", "c@d.com"]);
    expect(emails).toEqual(["a@b.com", "c@d.com"]);
    expect(skipped).toEqual([]);
  });

  it("兼容单个字符串（旧调用方）", () => {
    expect(normalizeInviteEmails("a@b.com").emails).toEqual(["a@b.com"]);
  });

  it("去重后标记 duplicate —— 大小写不同视为同一邮箱", () => {
    const { emails, skipped } = normalizeInviteEmails(["a@b.com", "A@B.com"]);
    expect(emails).toEqual(["a@b.com"]);
    expect(skipped).toEqual([{ email: "A@B.com", reason: "duplicate" }]);
  });

  it("非法格式挑出为 invalid_email，不影响其余邮箱", () => {
    const { emails, skipped } = normalizeInviteEmails(["ok@b.com", "not-an-email"]);
    expect(emails).toEqual(["ok@b.com"]);
    expect(skipped).toEqual([{ email: "not-an-email", reason: "invalid_email" }]);
  });

  it("空白项与非字符串直接忽略，不计入跳过", () => {
    const { emails, skipped } = normalizeInviteEmails(["  ", null, 42, "ok@b.com"]);
    expect(emails).toEqual(["ok@b.com"]);
    expect(skipped).toEqual([]);
  });

  it("非数组非字符串入参返回空结果", () => {
    expect(normalizeInviteEmails(undefined)).toEqual({ emails: [], skipped: [] });
  });
});

describe("resolveLinkHours", () => {
  it("缺省/非法回落到 24 小时", () => {
    expect(resolveLinkHours(undefined)).toBe(DEFAULT_LINK_HOURS);
    expect(resolveLinkHours("abc")).toBe(DEFAULT_LINK_HOURS);
    expect(resolveLinkHours(NaN)).toBe(DEFAULT_LINK_HOURS);
  });

  it("正常值原样取整", () => {
    expect(resolveLinkHours(72)).toBe(72);
    expect(resolveLinkHours("168")).toBe(168);
    expect(resolveLinkHours(48.7)).toBe(48);
  });

  it("越界夹到 [1, 720]", () => {
    expect(resolveLinkHours(0)).toBe(1);
    expect(resolveLinkHours(-5)).toBe(1);
    expect(resolveLinkHours(99999)).toBe(720);
  });
});
