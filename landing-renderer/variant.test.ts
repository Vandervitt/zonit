import { describe, it, expect } from "vitest";
import {
  fnv1a,
  deriveVariant,
  IDENTITY_VARIANT,
  sectionWrap,
  newVariantSeed,
} from "./variant";

describe("fnv1a", () => {
  it("确定性：同串同哈希", () => {
    expect(fnv1a("abc")).toBe(fnv1a("abc"));
  });
  it("异串异哈希（高概率）", () => {
    expect(fnv1a("abc")).not.toBe(fnv1a("abd"));
  });
  it("输出为无符号 32 位整数", () => {
    const h = fnv1a("zonit");
    expect(Number.isInteger(h)).toBe(true);
    expect(h).toBeGreaterThanOrEqual(0);
    expect(h).toBeLessThanOrEqual(0xffffffff);
  });
});

describe("deriveVariant", () => {
  it("同种子结果完全一致", () => {
    expect(deriveVariant("page-1")).toEqual(deriveVariant("page-1"));
  });
  it("不同种子 seedHash 不同", () => {
    expect(deriveVariant("page-1").seedHash).not.toBe(deriveVariant("page-2").seedHash);
  });
  it("非恒等，且 metaToken 非空", () => {
    const v = deriveVariant("page-1");
    expect(v.identity).toBe(false);
    expect(v.metaToken.length).toBeGreaterThan(0);
  });
});

describe("IDENTITY_VARIANT", () => {
  it("恒等：identity=true、seedHash=0、metaToken 空", () => {
    expect(IDENTITY_VARIANT.identity).toBe(true);
    expect(IDENTITY_VARIANT.seedHash).toBe(0);
    expect(IDENTITY_VARIANT.metaToken).toBe("");
  });
});

describe("newVariantSeed", () => {
  it("返回非空字符串", () => {
    expect(newVariantSeed().length).toBeGreaterThan(0);
  });
  it("连续两次高概率不同（重洗有效）", () => {
    expect(newVariantSeed()).not.toBe(newVariantSeed());
  });
  it("产出的种子经 deriveVariant 得非恒等变体", () => {
    expect(deriveVariant(newVariantSeed()).identity).toBe(false);
  });
});

describe("sectionWrap", () => {
  it("恒等变体恒返回 none（不包裹）", () => {
    for (let i = 0; i < 8; i++) {
      expect(sectionWrap(IDENTITY_VARIANT, i).tag).toBe("none");
    }
  });
  it("同变体 + 同 index 结果一致", () => {
    const v = deriveVariant("page-1");
    expect(sectionWrap(v, 3)).toEqual(sectionWrap(v, 3));
  });
  it("className 只能是空串或 contents", () => {
    const v = deriveVariant("page-1");
    for (let i = 0; i < 12; i++) {
      expect(["", "contents"]).toContain(sectionWrap(v, i).className);
    }
  });
  it("包裹时 data 属性名在白名单内", () => {
    const v = deriveVariant("page-abc");
    for (let i = 0; i < 12; i++) {
      const w = sectionWrap(v, i);
      if (w.tag === "div" && w.attr) {
        expect(["data-v", "data-sx", "data-blk", "data-r"]).toContain(w.attr);
      }
    }
  });
});
