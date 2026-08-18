import { describe, it, expect } from "vitest";
import { locales } from "./config";
import { getDictionary } from "./dictionaries";
import { getAdminDictionary } from "./admin";
import { SITE_NAME } from "@/lib/seo/site";

// 更名 Zap Bridge → Urgizat 的守卫。
//
// 起因：这次替换动了 137 行文案，而全量 1598 条测试仍然全绿——没有任何一条
// 断言过品牌名，它们只把旧域当 fixture 用。全绿因此对文案替换毫无验证价值。
// 这个文件补上那一层：品牌名是散在几十个文案文件里的字面量，唯一能防住漏改的
// 就是「把所有文案摊平，断言旧串一个都不剩」。
//
// META_TOKENS 是唯一刻意保留旧串的地方（反同质化检测白名单，存量已发布页的
// meta 里带的是旧串），它不在字典里，不受本文件约束。

const LEGACY_BRAND = "Zap Bridge";
const LEGACY_DOMAIN = "zapbridge.tech";

/** 把嵌套字典摊平成 [路径, 字符串] 列表，便于定位到具体哪条文案漏改。 */
function flatten(node: unknown, path: string[] = []): Array<[string, string]> {
  if (typeof node === "string") return [[path.join("."), node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => flatten(v, [...path, String(i)]));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => flatten(v, [...path, k]));
  }
  return [];
}

describe("品牌名一致性", () => {
  it("SITE_NAME 已是新品牌", () => {
    expect(SITE_NAME).toBe("Urgizat");
  });

  it.each(locales)("营销站字典（%s）不残留旧品牌名与旧主域", (locale) => {
    const offenders = flatten(getDictionary(locale)).filter(
      ([, text]) => text.includes(LEGACY_BRAND) || text.includes(LEGACY_DOMAIN),
    );
    expect(offenders).toEqual([]);
  });

  it.each(locales)("后台字典（%s）不残留旧品牌名与旧主域", (locale) => {
    const offenders = flatten(getAdminDictionary(locale)).filter(
      ([, text]) => text.includes(LEGACY_BRAND) || text.includes(LEGACY_DOMAIN),
    );
    expect(offenders).toEqual([]);
  });

  it.each(locales)("营销站字典（%s）确实提到了新品牌 —— 防止误删成空", (locale) => {
    const mentions = flatten(getDictionary(locale)).filter(([, text]) => text.includes("Urgizat"));
    expect(mentions.length).toBeGreaterThan(0);
  });
});
