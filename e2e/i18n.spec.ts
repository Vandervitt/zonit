// e2e/i18n.spec.ts
// 营销站双语：/ 出英文、/zh 出中文，切换器往返保持路径，hreflang 齐备，后台不受影响。
// 不依赖数据库 fixture，故无需 RUN_DB_E2E。
import { test, expect } from "@playwright/test";

test.describe("营销站双语", () => {
  test("/ 渲染英文首页", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Ad-ready landing pages");
    await expect(page.getByRole("link", { name: "Start free" }).first()).toBeVisible();
  });

  test("/zh 渲染中文首页", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("投放级落地页");
    await expect(page.getByRole("link", { name: "免费开始" }).first()).toBeVisible();
  });

  test("切换器往返保持在首页", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("link", { name: "中文" }).first().click();
    await expect(page).toHaveURL(/\/zh$/);
    await page.getByRole("link", { name: "English" }).first().click();
    await expect(page).toHaveURL(/localhost:3001\/$/);
  });

  test("两种语言的 head 都含完整 hreflang", async ({ page }) => {
    for (const path of ["/", "/zh"]) {
      await page.goto(path);
      const langs = await page
        .locator('link[rel="alternate"][hreflang]')
        .evaluateAll((els) => els.map((e) => e.getAttribute("hreflang")));
      expect(langs).toContain("en");
      expect(langs).toContain("zh-Hans");
      expect(langs).toContain("x-default");
    }
  });

  test("中文页 canonical 指向 /zh", async ({ page }) => {
    await page.goto("/zh");
    const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
    expect(canonical).toMatch(/\/zh$/);
  });

  test("/zh 下的套餐对比表也是中文", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.getByText("最受欢迎").first()).toBeVisible();
  });

  test("/ 下的套餐对比表是英文", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Most popular").first()).toBeVisible();
  });

  test("/zh 子树标注中文语言属性", async ({ page }) => {
    await page.goto("/zh");
    await expect(page.locator('div[lang="zh-Hans"]').first()).toBeAttached();
  });

  test("/pricing 与 /zh/pricing 各出对应语言", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Pick the plan that fits");
    await page.goto("/zh/pricing");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("选择适合你的套餐");
  });

  test("/anti-ban 与 /zh/anti-ban 各出对应语言", async ({ page }) => {
    await page.goto("/anti-ban");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("One template, ten advertisers");
    await page.goto("/zh/anti-ban");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("同一套模板，十个广告主");
  });

  test("/login 与 /zh/login 各出对应语言", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back");
    await expect(page.getByPlaceholder("Your email")).toBeVisible();
    await page.goto("/zh/login");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("欢迎回来");
    await expect(page.getByPlaceholder("你的邮箱")).toBeVisible();
  });

  test("/register 与 /zh/register 各出对应语言", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("Create your account");
    await page.goto("/zh/register");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("创建账号");
  });

  test("模板画廊：行业分组标题与卡片各出对应语言", async ({ page }) => {
    await page.goto("/templates");
    await expect(page.getByRole("heading", { name: "Beauty & personal care" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Toys & baby" })).toBeVisible();
    await page.goto("/zh/templates");
    await expect(page.getByRole("heading", { name: "美妆个护" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "玩具母婴" })).toBeVisible();
  });

  test("模板详情页：seoIntro 与派生 FAQ 各出对应语言", async ({ page }) => {
    await page.goto("/templates/vitamins");
    await expect(page.getByText(/Vitae Nutrition is a discovery-capture template/)).toBeVisible();
    await expect(page.getByText(/Can I change anything in the Vitae Nutrition template/)).toBeVisible();
    await page.goto("/zh/templates/vitamins");
    await expect(page.getByText(/Vitae Nutrition 是面向膳食补充剂出海/)).toBeVisible();
    await expect(page.getByText(/Vitae Nutrition 模板可以随意修改吗/)).toBeVisible();
  });

  test("模板详情页面包屑随语言变化", async ({ page }) => {
    await page.goto("/templates/vitamins");
    await expect(page.getByRole("link", { name: "Templates" }).first()).toBeVisible();
    await page.goto("/zh/templates/vitamins");
    await expect(page.getByRole("link", { name: "模板库" }).first()).toBeVisible();
  });

  test("指南列表与详情各出对应语言", async ({ page }) => {
    await page.goto("/guides");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Overseas lead-gen landing page guides",
    );
    await page.goto("/guides/whatsapp-lead-landing-page");
    await expect(page.getByRole("heading", { name: "The five most common mistakes" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "References" })).toBeVisible();

    await page.goto("/zh/guides");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("海外获客落地页指南");
    await page.goto("/zh/guides/whatsapp-lead-landing-page");
    await expect(page.getByRole("heading", { name: "最常见的 5 个错误" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "参考资料" })).toBeVisible();
  });

  test("llms.txt 为英文并同时列出双语 URL", async ({ request }) => {
    const res = await request.get("/llms.txt");
    expect(res.status()).toBe(200);
    const body = await res.text();
    expect(body).toContain("Core capabilities");
    expect(body).toContain("/zh/pricing");
    expect(body).toContain("/zh/templates");
  });

  test("各页的切换器往返都保持在同一页", async ({ page }) => {
    // 切换器的 aria-label 用「当前页语言」表述：英文页是 "Switch language: 中文"，
    // 中文页是 "切换语言: English"。
    // /pricing 不在此列——该页本来就没有站点导航（裸 main + 对比表），故无切换器落点。
    for (const route of ["/anti-ban", "/login", "/register", "/templates", "/guides"]) {
      await page.goto(route);
      await page.getByRole("link", { name: /Switch language/ }).first().click();
      await expect(page).toHaveURL(new RegExp(`/zh${route}$`));
      await page.getByRole("link", { name: /切换语言/ }).first().click();
      await expect(page).toHaveURL(new RegExp(`localhost:3001${route}$`));
    }
  });

  test("已国际化的页面都显示切换器", async ({ page }) => {
    // 反向保护见 lib/i18n/routes.test.ts：未登记路由 localePath 原样返回，
    // LocaleSwitcher 据此隐藏，避免链到不存在的 /zh 地址。
    for (const route of ["/", "/anti-ban", "/templates", "/guides", "/login"]) {
      await page.goto(route);
      expect(
        await page.getByRole("link", { name: /Switch language/ }).count(),
        route,
      ).toBeGreaterThan(0);
    }
  });

  test("未国际化的后台入口不受影响：/zh/admin 返回 404", async ({ page }) => {
    const res = await page.goto("/zh/admin");
    expect(res?.status()).toBe(404);
  });
});
