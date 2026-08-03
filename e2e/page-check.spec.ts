// e2e/page-check.spec.ts
// 自检器的用户链路与两条红线：报告不下判定、报告页 noindex。
import { test, expect } from "@playwright/test";

// 全部用例共用同一 URL：首次真检查，其余命中 15 分钟缓存。
// 缓存命中不计入限频（见 app/api/tools/page-check/route.ts），
// 因此整个文件只消耗每语言 1 次额度——否则跑到后面必然被自己的限频拦下。
const EN_URL = "https://example.com/?e2e=en";
const ZH_URL = "https://example.com/?e2e=zh";

test.describe("落地页自检器", () => {
  // 一次运行中的**第一次真检查**要同时付两笔时间：next dev 冷编译该 API 路由，
  // 以及真实抓取外站（robots + 页面 + 政策链接探测）。两者叠加超过默认 30s。
  // 后续用例命中 15 分钟缓存，通常在 1s 内完成。
  test.setTimeout(90_000);

  test("贴 URL → 出报告 → 报告可分享且不下判定", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByLabel(/Landing page URL/i).fill(EN_URL);
    await page.getByRole("button", { name: /Check this page/i }).click();

    await page.waitForURL(/\/tools\/landing-page-check\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    // 红线：免责声明必须在场，且说明这不是判定
    await expect(page.getByText(/not a verdict/i)).toBeVisible();
    // 可分享性必须明示
    await expect(page.getByText(/Anyone with this link/i)).toBeVisible();
  });

  test("报告页 noindex——内容是他人页面的检查结果，不该进索引", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel(/Landing page URL/i).fill(EN_URL);
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

  test("匿名用户看到的是「登录后实测」，而不是会失败的按钮", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel(/Landing page URL/i).fill(EN_URL);
    await page.getByRole("button", { name: /Check this page/i }).click();
    await page.waitForURL(/\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    // 楔子：把「疑似 → 实测」作为登录理由说清楚
    await expect(page.getByRole("link", { name: /Sign in to verify/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Run a real browser check/i })).toHaveCount(0);
  });

  test("未登录直接调实测接口返回 401", async ({ request, page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel(/Landing page URL/i).fill(EN_URL);
    await page.getByRole("button", { name: /Check this page/i }).click();
    await page.waitForURL(/\/r\/([A-Za-z0-9]+)$/, { timeout: 45_000 });
    const id = page.url().split("/").pop()!;
    const res = await request.post(`/api/tools/page-check/${id}/verify`);
    expect(res.status()).toBe(401);
  });

  test("中文侧同样可用", async ({ page }) => {
    await page.goto("/zh/tools/landing-page-check");
    await expect(page.getByRole("heading", { level: 1 })).toContainText("审核");
    await page.getByLabel(/落地页地址/).fill(ZH_URL);
    await page.getByRole("button", { name: /检查这张页面/ }).click();
    await page.waitForURL(/\/zh\/tools\/landing-page-check\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    await expect(page.getByText(/不是判定/)).toBeVisible();
  });
});
