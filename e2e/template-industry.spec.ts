// e2e/template-industry.spec.ts
// 行业中间层的用户链路：画廊 → 行业 → 模板详情，以及详情页沿面包屑回到行业页。
// 这条 hub-and-spoke 内链是本次 SEO 改造的主要结构改动，断了就等于中间层没上线。
import { test, expect } from "@playwright/test";

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
    await page.getByRole("link", { name: "医疗" }).first().click();

    await expect(page).toHaveURL(/\/zh\/templates\/industry\/medical$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("医疗诊所落地页模板");
    await expect(page.getByRole("heading", { name: "线索怎么进来" })).toBeVisible();
  });

  test("模板数不足门槛的行业页输出 noindex，可访问但不请求收录", async ({ page }) => {
    await page.goto("/templates/industry/legal");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "Legal & immigration landing page templates",
    );
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
      "content",
      /noindex/,
    );

    // 模板充足的行业则不得带 noindex。
    await page.goto("/templates/industry/beauty");
    await expect(page.locator('meta[name="robots"]')).toHaveCount(0);
  });
});
