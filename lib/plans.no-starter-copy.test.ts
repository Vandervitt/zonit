import { describe, it, expect } from "vitest";
import { locales } from "./i18n/config";
import { getDictionary } from "./i18n/dictionaries";
import { getAdminDictionary } from "./i18n/admin";
import { getHelpChapters } from "@/app/admin/(workspace)/help/_content";

// 2026-10-28 去掉 Starter 档。档位名散在营销 / 后台 / 帮助中心文案里，
// 而类型系统只管得到 PlanId，管不到「升级到 Starter 及以上」这种字面量——
// 漏一处就是在劝客户去买一个不存在的档位。

function flatten(node: unknown, path: string[] = []): Array<[string, string]> {
  if (typeof node === "string") return [[path.join("."), node]];
  if (Array.isArray(node)) return node.flatMap((v, i) => flatten(v, [...path, String(i)]));
  if (node && typeof node === "object") {
    return Object.entries(node).flatMap(([k, v]) => flatten(v, [...path, k]));
  }
  return [];
}

describe("文案不再提到已下架的 Starter 档", () => {
  it.each(locales)("%s：营销字典、后台字典、帮助中心", (locale) => {
    const all = [
      ...flatten(getDictionary(locale), ["marketing"]),
      ...flatten(getAdminDictionary(locale), ["admin"]),
      ...flatten(getHelpChapters(locale), ["help"]),
    ];
    expect(all.filter(([, text]) => /\bStarter\b/.test(text)).map(([p]) => p)).toEqual([]);
  });
});
