// 首页「Free 能不能发布」口径守卫。
//
// Free 没有自有域名槽位，但可以用平台分配的地址真正发布（见
// app/api/domains/platform-subdomain/route.ts——该接口只校验登录，不校验套餐）。
// 这条口径曾经漂移过：套餐对比表改对了，首页三步流程 / 定价 / 结尾 CTA 仍写着
// 「免费只能创建、编辑、预览」，把刚打通的激活路径又藏了回去。
//
// 故此处只守两件事：首页不得声称免费仅限预览，且必须明说免费可发布。
import { describe, expect, it } from "vitest";
import { home as en } from "./dictionaries/en/home";
import { home as zh } from "./dictionaries/zh/home";
import { plans as enPlans } from "./dictionaries/en/plans";

/** 会让读者以为「免费发不出去」的表述。 */
const PREVIEW_ONLY = [
  /create,? (?:save,? )?edit,? and preview/i,
  /create,? save,? and preview/i,
  /创建、编辑与预览完全免费/,
  /可创建、保存和在线预览/,
];

/** 首页里承担「免费也能上线」这句话的文案位。 */
const CLAIM_SITES = (d: typeof en | typeof zh) => [
  d.steps.desc,
  d.pricing.title + d.pricing.desc,
  d.finalCta.desc,
];

describe.each([
  ["en", en],
  ["zh", zh],
])("%s 首页免费发布口径", (_locale, dict) => {
  it("不出现「免费仅限预览」的表述", () => {
    const all = CLAIM_SITES(dict).join("\n");
    for (const pattern of PREVIEW_ONLY) {
      expect(all).not.toMatch(pattern);
    }
  });

  it("定价与结尾 CTA 明说免费可发布上线", () => {
    expect(dict.pricing.desc).toMatch(/publish|发布/i);
    expect(dict.finalCta.desc).toMatch(/publish|发布/i);
  });

  it("首屏示意徽标不出现投放机制术语", () => {
    const badges = Object.values(dict.editorMock).join(" ");
    expect(badges).not.toMatch(/pixel|capi|utm/i);
  });
});

it("套餐对比表仍把 Free 的发布地址标为平台提供", () => {
  // 首页口径的事实源头：这一格若退回破折号 / 0，首页那几句就成了空头支票。
  expect(enPlans.rows.customDomain.freeValue).toMatch(/platform/i);
});
