// 自检器站内入口守卫。
//
// 背景：自检器（/tools/landing-page-check）上线时已进 sitemap，却**零站内内链**——
// 导航、首页、指南里都没有链到它，全库只有 UA 字符串和路由常量提到它。
// 能被收录不等于能被走到，孤儿页在站内权重和发现路径上都是断的。
//
// 本次补了三处入口：页脚（全站可达）、首页归因区尾部（次级一行）、
// 合规簇指南的次 CTA（导流主力）。这里守住它们不被悄悄删回去。
//
// ⚠️ 刻意不写禁词断言。lib/tools/copy-coverage.test.ts 里记着教训：自检器红线
// （不给评分、不承诺过审）用禁词表守会反复误杀否定式文案——「我们不给页面打分」
// 里就有「打分」。那份文案的红线由该文件的正向断言守，本文件只管入口在不在。
import { describe, expect, it } from "vitest";
import { getDictionary } from "./dictionaries";
import { locales } from "./config";
import { getGuides } from "@/app/guides/_content";
import { LOCALIZED_ROUTES } from "./routes";
import { Routes } from "@/lib/constants";

describe.each(locales)("%s 自检器入口文案", (locale) => {
  const d = getDictionary(locale);

  it("页脚有自检器入口", () => {
    expect(d.common.footer.pageCheck?.trim()).toBeTruthy();
  });

  it("首页归因区尾部有次级入口（两段都不能空，否则渲染出半句话）", () => {
    expect(d.home.pageCheckTeaser.text.trim()).toBeTruthy();
    expect(d.home.pageCheckTeaser.link.trim()).toBeTruthy();
  });

  it("合规簇指南有专用次 CTA 文案", () => {
    expect(d.guides.detail.ctaPageCheck?.trim()).toBeTruthy();
  });
});

it("合规簇非空——它是自检器的导流主力，清空等于把主入口拆了", () => {
  // 次 CTA 挂在 ctaTarget === "anti-ban" 这批文章上（见 GuideDetail.tsx）。
  // 若哪天合规簇整体改了 ctaTarget，自检器会无声地失去最精准的一批流量。
  const compliance = getGuides("en").filter((g) => g.ctaTarget === "anti-ban");
  expect(compliance.length).toBeGreaterThan(0);
});

it("自检器路由仍登记在国际化清单里（页脚与首页入口靠 localePath 生成 /zh 地址）", () => {
  expect(LOCALIZED_ROUTES).toContain(Routes.PageCheck);
});
