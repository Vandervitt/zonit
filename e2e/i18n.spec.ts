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

  test("未国际化的后台入口不受影响：/zh/admin 返回 404", async ({ page }) => {
    const res = await page.goto("/zh/admin");
    expect(res?.status()).toBe(404);
  });
});
