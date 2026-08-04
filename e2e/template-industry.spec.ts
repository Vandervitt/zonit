// e2e/template-industry.spec.ts
// 行业中间层的用户链路：画廊 → 行业 → 模板详情，以及详情页沿面包屑回到行业页。
// 这条 hub-and-spoke 内链是本次 SEO 改造的主要结构改动，断了就等于中间层没上线。
import { test, expect } from "@playwright/test";
import {
  industryCategories,
  isIndexableIndustry,
} from "@/lib/templates/industries";

test.describe("模板行业中间层", () => {
  test("画廊行业标题可点进行业页，行业页 h1 命中行业关键词", async ({ page }) => {
    await page.goto("/templates");
    await page.getByRole("link", { name: "Beauty & personal care" }).first().click();

    await expect(page).toHaveURL(/\/templates\/industry\/beauty$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Beauty & personal care landing page templates",
    );
    // 行业页必须有该行业独有的正文，而不是画廊页的复制品。
    await expect(page.getByRole("heading", { name: "Who it's for" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "How inquiries come in" })).toBeVisible();
  });

  test("行业页 → 模板详情 → 沿面包屑回到行业页", async ({ page }) => {
    await page.goto("/templates/industry/medical");
    const first = page.getByRole("link", { name: /template preview/ }).first();
    await first.click();
    await expect(page).toHaveURL(/\/templates\/[a-z0-9-]+$/);

    // 详情页 h1 带行业关键词（此前只有虚构品牌名）。
    await expect(page.getByRole("heading", { level: 1 }).first()).toContainText(
      "landing page template",
    );
    // 三层面包屑的中间层可点回行业页。
    await page.getByRole("link", { name: "Medical", exact: true }).first().click();
    await expect(page).toHaveURL(/\/templates\/industry\/medical$/);
  });

  test("中文行业页出中文文案且 URL 带 /zh 前缀", async ({ page }) => {
    await page.goto("/zh/templates");
    // 点击 + 断言跳转一起重试：链接在 hydration 完成前就已渲染，过早点击不会导航
    // （停在 /zh/templates），全量跑时最容易撞上。
    await expect(async () => {
      await page.getByRole("link", { name: "医疗" }).first().click();
      await expect(page).toHaveURL(/\/zh\/templates\/industry\/medical$/, { timeout: 5_000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByRole("heading", { level: 1 })).toContainText("医疗诊所落地页模板");
    await expect(page.getByRole("heading", { name: "线索怎么进来" })).toBeVisible();
  });

  test("模板数达门槛的行业页不带 noindex；不足门槛的（若有）带 noindex", async ({ page }) => {
    // ⚠️ 判定必须取自与产品同一份事实源（lib/templates/industries），不能钉死某个行业：
    // 原用例把 legal 当作「模板不足」的样本，模板库补到 2 套后它转为可索引，用例就
    // 一直红着。阈值本身的逐行业断言在 lib/seo/industry-content.test.ts。
    await page.goto("/templates/industry/beauty");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);

    const thin = industryCategories().find((c) => !isIndexableIndustry(c));
    test.skip(!thin, "当前没有低于收录门槛的行业（模板库已补齐），无 noindex 样本可测。");

    await page.goto(`/templates/industry/${thin}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });
});
