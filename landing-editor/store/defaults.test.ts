// 新建区块 / 组件的默认内容会被**写进客户的落地页**，读者是海外访客，
// 与后台界面语言无关（产品是出海获客）。故默认文案一律英文。
//
// 这条守卫的由来：区块标题此前是中文，中文后台用户一加区块，
// 给海外访客的页面上就多了个中文标题——而同文件的 createLeadForm
// 早就按英文口径写了，两边不一致了很久没人发现。
import { describe, it, expect } from "vitest";
import { SECTION_REGISTRY, type LandingSectionType } from "@/types/schema.draft";
import { createSection, createFloatingButton, createLeadForm } from "./defaults";

const CJK = /[一-鿿]/;

/** 摊平一个默认值对象里所有字符串，用于扫中文。 */
function strings(node: unknown, out: string[] = []): string[] {
  if (typeof node === "string") out.push(node);
  else if (Array.isArray(node)) node.forEach((n) => strings(n, out));
  else if (node && typeof node === "object") Object.values(node).forEach((n) => strings(n, out));
  return out;
}

const SECTION_TYPES = Object.keys(SECTION_REGISTRY) as LandingSectionType[];

describe("落地页默认内容不得含中文", () => {
  it.each(SECTION_TYPES)("createSection(%s)", (type) => {
    const offenders = strings(createSection(type)).filter((s) => CJK.test(s));
    expect(offenders).toEqual([]);
  });

  it("createFloatingButton / createLeadForm", () => {
    const offenders = [...strings(createFloatingButton()), ...strings(createLeadForm())].filter((s) =>
      CJK.test(s),
    );
    expect(offenders).toEqual([]);
  });

  it("每种区块类型都有默认值工厂（新增类型时不会漏）", () => {
    for (const type of SECTION_TYPES) {
      expect(createSection(type).type, type).toBe(type);
    }
  });
});
