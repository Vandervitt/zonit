import { describe, it, expect } from "vitest";
import { locales } from "./config";
import { getDictionary } from "./dictionaries";
import { getAdminDictionary } from "./admin";
import { SIGNUP_TRIAL_DAYS } from "@/lib/plans";
import { getHelpChapters } from "@/app/admin/(workspace)/help/_content";

// 注册试用天数的文案守卫。
//
// 天数是散在十几处营销 / 后台文案里的字面量（首屏、定价页、注册页、模板 CTA……），
// 而 SIGNUP_TRIAL_DAYS 一改，没有任何既有测试会断言文案——这正是本项目
// 「文案与能力脱节」反复复发的形态。这里把字典摊平，抓出所有「N 天 Pro」类表述，
// 断言 N 与常量一致。帮助中心章节不在字典里，单独摊平一并纳入。

function flatten(node: unknown, path: string[] = []): Array<[string, string]> {
  if (typeof node === "string") return [[path.join("."), node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => flatten(v, [...path, String(i)]));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => flatten(v, [...path, k]));
  }
  return [];
}

/** 抽出文案里宣称的试用天数；与宽限期、预览链接有效期等其他「N 天」区分开，只认挨着 Pro 的。 */
function trialDayClaims(text: string): number[] {
  const patterns = [
    /(\d+) days? of (?:full )?Pro/g, // "14 days of full Pro"
    /Pro(?: 全功能)?(?:试用)? ?(\d+) 天/g, // 「Pro 全功能试用 14 天」「Pro 14 天」
    /(\d+) 天 ?(?:完整 )?Pro/g, // 「14 天完整 Pro」「送 14 天 Pro」
  ];
  return patterns.flatMap((re) => [...text.matchAll(re)].map((m) => Number(m[1])));
}

const ALL_COPY = locales.flatMap((locale) => [
  ...flatten(getDictionary(locale), [locale, "marketing"]),
  ...flatten(getAdminDictionary(locale), [locale, "admin"]),
  ...flatten(getHelpChapters(locale), [locale, "help"]),
]);

describe("注册试用天数文案", () => {
  it("抽取规则能识别中英两种写法", () => {
    expect(trialDayClaims("Every sign-up gets 9 days of full Pro")).toEqual([9]);
    expect(trialDayClaims("注册即赠 Pro 全功能试用 9 天")).toEqual([9]);
    expect(trialDayClaims("注册即得 9 天完整 Pro")).toEqual([9]);
    expect(trialDayClaims("免费开始 · 注册即送 9 天 Pro")).toEqual([9]);
    expect(trialDayClaims("超出的部分会先进入 7 天宽限")).toEqual([]);
  });

  it("字典里确实有试用天数文案 —— 防止规则失配后空跑全绿", () => {
    expect(ALL_COPY.filter(([, text]) => trialDayClaims(text).length > 0).length).toBeGreaterThan(5);
  });

  it(`所有文案宣称的天数都等于 SIGNUP_TRIAL_DAYS`, () => {
    const offenders = ALL_COPY.filter(([, text]) =>
      trialDayClaims(text).some((n) => n !== SIGNUP_TRIAL_DAYS),
    ).map(([path]) => path);
    expect(offenders).toEqual([]);
  });
});
