import { describe, it, expect } from "vitest";
import { normalizeEmail, normalizePhone, sha256, hashEmail, hashPhone } from "./hash";

describe("normalize", () => {
  it("email 小写去空格", () => {
    expect(normalizeEmail("  Tom@Example.COM ")).toBe("tom@example.com");
  });
  it("phone 去非数字（保留数字）", () => {
    expect(normalizePhone("+1 (555) 010-0199")).toBe("15550100199");
  });
});

describe("sha256", () => {
  it("已知向量", () => {
    // echo -n "abc" | sha256sum
    expect(sha256("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("hashEmail/hashPhone", () => {
  it("先标准化再哈希；空值返回 undefined", () => {
    expect(hashEmail("Tom@Example.com")).toBe(sha256("tom@example.com"));
    expect(hashEmail("")).toBeUndefined();
    expect(hashPhone("+1 555 010 0199")).toBe(sha256("15550100199"));
    expect(hashPhone(undefined)).toBeUndefined();
  });
});
