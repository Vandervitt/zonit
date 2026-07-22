import { describe, it, expect } from "vitest";
import { isValidEmailFormat } from "./trusted-email";

describe("isValidEmailFormat（任意后缀，仅格式校验）", () => {
  it("接受任意合法邮箱后缀", () => {
    expect(isValidEmailFormat("user@gmail.com")).toBe(true);
    expect(isValidEmailFormat("user@outlook.com")).toBe(true);
    expect(isValidEmailFormat("user@qq.com")).toBe(true);
    expect(isValidEmailFormat("user@163.com")).toBe(true);
    expect(isValidEmailFormat("user@zapbridge.com")).toBe(true);
    expect(isValidEmailFormat("a.b+tag@sub.example.co")).toBe(true);
  });

  it("首尾空白容忍", () => {
    expect(isValidEmailFormat("  user@example.com ")).toBe(true);
  });

  it("拒绝空值与格式非法", () => {
    expect(isValidEmailFormat("")).toBe(false);
    expect(isValidEmailFormat(null)).toBe(false);
    expect(isValidEmailFormat(undefined)).toBe(false);
    expect(isValidEmailFormat("no-at-sign")).toBe(false);
    expect(isValidEmailFormat("user@nodot")).toBe(false);
    expect(isValidEmailFormat("user@@example.com")).toBe(false);
    expect(isValidEmailFormat("user @example.com")).toBe(false);
    expect(isValidEmailFormat("@example.com")).toBe(false);
  });
});
