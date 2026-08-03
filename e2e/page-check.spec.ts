// e2e/page-check.spec.ts
// 自检器的用户链路与两条红线：报告不下判定、报告页 noindex。
import { test, expect } from "@playwright/test";

test.describe("落地页自检器", () => {
  test("贴 URL → 出报告 → 报告可分享且不下判定", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByLabel(/Landing page URL/i).fill("https://example.com/?e2e=1");
    await page.getByRole("button", { name: /Check this page/i }).click();

    await page.waitForURL(/\/tools\/landing-page-check\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    // 红线：免责声明必须在场，且说明这不是判定
    await expect(page.getByText(/not a verdict/i)).toBeVisible();
    // 可分享性必须明示
    await expect(page.getByText(/Anyone with this link/i)).toBeVisible();
  });

  test("报告页 noindex——内容是他人页面的检查结果，不该进索引", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel(/Landing page URL/i).fill("https://example.com/?e2e=2");
    await page.getByRole("button", { name: /Check this page/i }).click();
    await page.waitForURL(/\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  test("非法地址在前端给出可读提示，不跳转", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel(/Landing page URL/i).fill("http://example.com/");
    await page.getByRole("button", { name: /Check this page/i }).click();
    // 用具体 id 而非 role=alert：Next 的路由播报器同样是 role="alert"，会撞上严格模式。
    await expect(page.locator("#page-check-error")).toContainText(/https/i);
    await expect(page).toHaveURL(/\/tools\/landing-page-check$/);
  });

  test("中文侧同样可用", async ({ page }) => {
    await page.goto("/zh/tools/landing-page-check");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("审核");
    await page.getByLabel(/落地页地址/).fill("https://example.com/?e2e=3");
    await page.getByRole("button", { name: /检查这张页面/ }).click();
    await page.waitForURL(/\/zh\/tools\/landing-page-check\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    await expect(page.getByText(/不是判定/)).toBeVisible();
  });
});
