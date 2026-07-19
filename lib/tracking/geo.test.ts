import { describe, it, expect } from "vitest";
import { isEeaCountry, shouldCollectFirstParty } from "./geo";

describe("isEeaCountry", () => {
  it("欧盟成员国判定为真（大小写不敏感）", () => {
    expect(isEeaCountry("DE")).toBe(true);
    expect(isEeaCountry("fr")).toBe(true);
    expect(isEeaCountry("IE")).toBe(true);
  });
  it("EEA 非欧盟成员（挪威/冰岛/列支敦士登）与英国也判为真", () => {
    expect(isEeaCountry("NO")).toBe(true);
    expect(isEeaCountry("IS")).toBe(true);
    expect(isEeaCountry("LI")).toBe(true);
    expect(isEeaCountry("GB")).toBe(true);
  });
  it("非 EEA 国家判为假", () => {
    expect(isEeaCountry("US")).toBe(false);
    expect(isEeaCountry("CN")).toBe(false);
    expect(isEeaCountry("JP")).toBe(false);
  });
  it("缺失/空值判为假（无法判定时按非欧盟处理，保持采集）", () => {
    expect(isEeaCountry(null)).toBe(false);
    expect(isEeaCountry(undefined)).toBe(false);
    expect(isEeaCountry("")).toBe(false);
  });
});

describe("shouldCollectFirstParty", () => {
  it("非欧盟访客始终采集（不受同意状态影响）", () => {
    expect(shouldCollectFirstParty(false, false)).toBe(true);
    expect(shouldCollectFirstParty(false, true)).toBe(true);
  });
  it("欧盟访客仅在已同意后采集", () => {
    expect(shouldCollectFirstParty(true, false)).toBe(false);
    expect(shouldCollectFirstParty(true, true)).toBe(true);
  });
});
