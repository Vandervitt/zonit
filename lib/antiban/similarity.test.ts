import { describe, it, expect } from "vitest";
import type { LandingSectionType } from "@/types/schema.draft";
import {
  extractStructure, structureSignature, buildSimilarityReport,
} from "./similarity";

const seq = (...types: LandingSectionType[]) => ({ sequence: types, hasVariantSeed: false });
const page = (
  pageId: string,
  types: LandingSectionType[],
  hasVariantSeed = false,
) => ({ pageId, name: pageId, status: "published", structure: { sequence: types, hasVariantSeed } });

describe("extractStructure", () => {
  it("只取区块类型与顺序，不碰任何文案——改文字不改变判重风险", () => {
    const draft = {
      sections: [
        { type: "features", data: { title: "全新文案" } },
        { type: "faq", data: { title: "另一套文案" } },
      ],
      variantSeed: "abc",
    } as never;
    expect(extractStructure(draft)).toEqual({ sequence: ["features", "faq"], hasVariantSeed: true });
  });

  it("没有 sections 或没有种子时不炸", () => {
    expect(extractStructure({} as never)).toEqual({ sequence: [], hasVariantSeed: false });
  });
});

describe("structureSignature", () => {
  it("顺序不同即不同签名——顺序本身就是判重信号", () => {
    expect(structureSignature(seq("features", "faq")))
      .not.toBe(structureSignature(seq("faq", "features")));
  });

  it("空骨架有稳定签名，不会与真实骨架混淆", () => {
    expect(structureSignature(seq())).toBe("(empty)");
  });
});

describe("buildSimilarityReport", () => {
  it("骨架相同的页归为一组，只出现一次的不算重复", () => {
    const r = buildSimilarityReport([
      page("a", ["features", "faq"]),
      page("b", ["features", "faq"]),
      page("c", ["reviews"]),
    ]);
    expect(r.total).toBe(3);
    expect(r.clusters).toHaveLength(1);
    expect(r.clusters[0].pages.map((p) => p.pageId)).toEqual(["a", "b"]);
    expect(r.duplicated).toBe(2);
  });

  it("统计未打散指纹的页数——这是唯一可行动的那个数", () => {
    const r = buildSimilarityReport([
      page("a", ["features"], true),
      page("b", ["features"], false),
      page("c", ["features"], false),
    ]);
    expect(r.clusters[0].unseeded).toBe(2);
    expect(r.unseeded).toBe(2);
  });

  it("组按页数降序，页数相同时未打散多的排前面", () => {
    const r = buildSimilarityReport([
      page("a", ["faq"]), page("b", ["faq"]),
      page("c", ["features"]), page("d", ["features"]), page("e", ["features"]),
    ]);
    expect(r.clusters[0].sequence).toEqual(["features"]);
    expect(r.clusters[0].pages).toHaveLength(3);
  });

  it("全部页骨架各不相同 → 无重复组", () => {
    const r = buildSimilarityReport([page("a", ["faq"]), page("b", ["features"])]);
    expect(r.clusters).toEqual([]);
    expect(r.duplicated).toBe(0);
  });

  it("没有已发布页时给出零值而不是崩溃", () => {
    expect(buildSimilarityReport([])).toEqual({ total: 0, clusters: [], duplicated: 0, unseeded: 0 });
  });
});
