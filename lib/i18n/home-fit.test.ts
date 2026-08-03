// 首页反向定位区（fit）的口径守卫。
//
// 这一区主动说明「什么情况下别用我们」。它唯一容易写坏的方式，是把排除项
// 从「这张页面要干什么」滑向「客户是什么行业」——一旦写成「你要卖实体商品就
// 别用这里」，美妆 / 服饰 / 家居 / 保健品这些模板对应的电商客群就被整体推出门，
// 而他们的询盘页正是本产品的目标场景。
//
// 同一条区分在非交易红线上已经被误读过一次（红线禁的是生成页上的交易行为，
// 从不禁做电商生意的客户，见 docs/constraints/product-positioning.md），
// 所以这里用测试钉死，而不是只写注释。
import { describe, expect, it } from "vitest";
import { home as en } from "./dictionaries/en/home";
import { home as zh } from "./dictionaries/zh/home";

/** 按「客户是谁 / 卖什么」下排除结论的表述——一条都不许出现。 */
const IDENTITY_BASED_EXCLUSION = [
  /if you sell\b/i,
  /physical (?:products?|goods)/i,
  /\be-?commerce (?:brands?|sellers?|businesses)/i,
  /如果你(?:是|卖)/,
  /实体(?:商品|产品)/,
  /电商(?:卖家|客户|品牌)/,
];

describe.each([
  ["en", en],
  ["zh", zh],
])("%s 首页反向定位区", (_locale, dict) => {
  const bad = dict.fit.bad.items.join("\n");

  it("排除项不按客户身份或所售品类下结论", () => {
    for (const pattern of IDENTITY_BASED_EXCLUSION) {
      expect(bad).not.toMatch(pattern);
    }
  });

  it("排除项落在「这张页面要干什么」上", () => {
    // 第一条排除项是收款场景——它必须把主语落在页面 / 收款动作上，
    // 而不是落在卖家身上。
    expect(dict.fit.bad.items[0]).toMatch(/page|页面/i);
  });

  it("两栏都不为空，且适合项不少于排除项", () => {
    expect(dict.fit.good.items.length).toBeGreaterThanOrEqual(dict.fit.bad.items.length);
    expect(dict.fit.bad.items.length).toBeGreaterThan(0);
  });
});

it("中英双语条目数一致（漏译会让某一面少掉一条排除项）", () => {
  expect(zh.fit.good.items).toHaveLength(en.fit.good.items.length);
  expect(zh.fit.bad.items).toHaveLength(en.fit.bad.items.length);
});
