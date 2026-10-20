// e2e/rfq-landing.spec.ts
// 外贸询盘落地页（产品页）冒烟：双语渲染、数量占位符已替换、主 CTA 直达模板深链并保留到登录。
import { test, expect } from "@playwright/test";

test.describe("外贸询盘落地页", () => {
  test("中文页：标题、模板数量、主 CTA 经中文登录页带着模板回跳", async ({ page }) => {
    await page.goto("/zh/rfq-landing-page");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("是一张能直接发询价的页面");
    await expect(page.getByRole("heading", { name: /^\d+ 套外贸 B2B 模板，自带询价表单$/ })).toBeVisible();
    await expect(page.locator("main")).not.toContainText("{rfqTemplates}");

    await expect(page.getByRole("link", { name: "看 B2B 模板" }).first()).toHaveAttribute("href", "/zh/templates/industry/b2b");
    await expect(page.getByRole("link", { name: "读 B2B 询价指南" })).toHaveAttribute("href", "/zh/guides/b2b-rfq-lead-generation");

    await page.getByRole("link", { name: "免费开始（用 OEM 模板）" }).click();
    await page.waitForURL(/\/zh\/login\?callbackUrl=/, { timeout: 30_000 });
    expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/admin/landing-pages?template=b2b-sourcing");
  });

  test("英文页：标题与指向英文模板/指南的链接", async ({ page }) => {
    await page.goto("/rfq-landing-page");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("They want somewhere to send an RFQ.");
    await expect(page.getByRole("heading", { name: /^\d+ B2B templates with the quote form built in$/ })).toBeVisible();
    await expect(page.getByRole("link", { name: "Browse B2B templates" }).first()).toHaveAttribute("href", "/templates/industry/b2b");
    await expect(page.getByRole("link", { name: "Read the B2B RFQ guide" })).toHaveAttribute("href", "/guides/b2b-rfq-lead-generation");
  });

  test("B2B 询价指南：主 CTA 指产品页，次 CTA 指回 B2B 模板（行业路径不断）", async ({ page }) => {
    await page.goto("/zh/guides/b2b-rfq-lead-generation");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("外贸询盘获客");
    await expect(page.getByRole("link", { name: "看看这里怎么做询价页" })).toHaveAttribute("href", "/zh/rfq-landing-page");
    await expect(page.getByRole("link", { name: /^查看.*模板$/ }).last()).toHaveAttribute("href", "/zh/templates/industry/b2b");

    // 行业页反向链接到本文（靠 industry 字段），不因产品页配对而断
    await page.goto("/zh/templates/industry/b2b");
    await expect(page.locator('a[href="/zh/guides/b2b-rfq-lead-generation"]').first()).toBeVisible();
  });
});

