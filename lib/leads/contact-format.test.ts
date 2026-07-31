import { describe, it, expect } from "vitest";
import { composeE164, isE164, normalizeTelegram } from "./contact-format";

describe("composeE164", () => {
  it("拼接国码与本地号，剔除空格括号横杠", () => {
    expect(composeE164("+1", "(555) 123-4567")).toBe("+15551234567");
    expect(composeE164("+86", "138 0013 8000")).toBe("+8613800138000");
  });

  it("剥掉本地中继前缀 0（英国 07911 → +447911）", () => {
    expect(composeE164("+44", "07911 123456")).toBe("+447911123456");
    expect(composeE164("+61", "0412345678")).toBe("+61412345678");
  });

  it("访客重复输入国码时不产生双国码", () => {
    expect(composeE164("+86", "+86 138 0013 8000")).toBe("+8613800138000");
    expect(composeE164("+86", "0086 13800138000")).toBe("+8613800138000");
  });

  it("本地号为空 → 空串（交由必填校验处理，不产出只有国码的假号码）", () => {
    expect(composeE164("+1", "")).toBe("");
    expect(composeE164("+1", "   ")).toBe("");
  });
});

describe("isE164", () => {
  it("合法号通过", () => {
    expect(isE164("+15551234567")).toBe(true);
    expect(isE164("+8613800138000")).toBe(true);
  });

  it("缺 + / 缺国码 / 过短 / 过长 / 含非数字 → 拒", () => {
    expect(isE164("15551234567")).toBe(false);
    expect(isE164("+0551234567")).toBe(false);
    expect(isE164("+123")).toBe(false);
    expect(isE164("+1234567890123456")).toBe(false);
    expect(isE164("+1555abc4567")).toBe(false);
  });
});

describe("normalizeTelegram", () => {
  it("@用户名 / 裸用户名 / t.me 链接 → 统一裸用户名", () => {
    expect(normalizeTelegram("@johndoe")).toBe("johndoe");
    expect(normalizeTelegram("johndoe")).toBe("johndoe");
    expect(normalizeTelegram("t.me/johndoe")).toBe("johndoe");
    expect(normalizeTelegram("https://t.me/johndoe")).toBe("johndoe");
    expect(normalizeTelegram(" @John_Doe1 ")).toBe("John_Doe1");
  });

  it("手机号等跳不了 t.me 的输入 → null（宁可让访客改，也不给一个点不开的链接）", () => {
    expect(normalizeTelegram("+8613800138000")).toBeNull();
    expect(normalizeTelegram("13800138000")).toBeNull();
    expect(normalizeTelegram("ab")).toBeNull();
    expect(normalizeTelegram("has space")).toBeNull();
    expect(normalizeTelegram("")).toBeNull();
  });
});
