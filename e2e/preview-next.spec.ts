// e2e/preview-next.spec.ts
import { test, expect } from "@playwright/test";

test.describe("preview-next 渲染器冒烟", () => {
  test("整页渲染样例关键内容", async ({ page }) => {
    const res = await page.goto("/preview-next");
    expect(res?.status()).toBe(200);
    // Hero 主标题（样例：Skincare that actually fits your skin）
    await expect(page.getByRole("heading", { name: /Skincare that actually fits/i })).toBeVisible();
    // Footer 品牌名
    await expect(page.getByText("Aurae Skincare").first()).toBeVisible();
    // FAQ 标题
    await expect(page.getByText("Frequently asked questions")).toBeVisible();
  });
});
