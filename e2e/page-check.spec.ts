// e2e/page-check.spec.ts
// 自检器的用户链路与两条红线：报告不下判定、报告页 noindex。
import { test, expect } from "@playwright/test";

// 全部用例共用同一 URL：首次真检查，其余命中 15 分钟缓存。
// 缓存命中不计入限频（见 app/api/tools/page-check/route.ts），
// 因此整个文件只消耗每语言 1 次额度——否则跑到后面必然被自己的限频拦下。
const EN_URL = "https://example.com/?e2e=en";
const ZH_URL = "https://example.com/?e2e=zh";
// 多页对比用：与 EN_URL 同 host、只有 query 不同——正是「两行会同名」的形态。
const CMP_URL = "https://example.com/?e2e=cmp";

test.describe("落地页自检器", () => {
  // 一次运行中的**第一次真检查**要同时付两笔时间：next dev 冷编译该 API 路由，
  // 以及真实抓取外站（robots + 页面 + 政策链接探测）。两者叠加超过默认 30s。
  // 后续用例命中 15 分钟缓存，通常在 1s 内完成。
  test.setTimeout(90_000);

  test("贴 URL → 出报告 → 报告可分享且不下判定", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    await page.getByLabel("Landing page URL", { exact: true }).fill(EN_URL);
    await page.getByRole("button", { name: /Check this page/i }).click();

    await page.waitForURL(/\/tools\/landing-page-check\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    // 红线：免责声明必须在场，且说明这不是判定
    await expect(page.getByText(/not a verdict/i)).toBeVisible();
    // 可分享性必须明示
    await expect(page.getByText(/Anyone with this link/i)).toBeVisible();
  });

  test("报告页 noindex——内容是他人页面的检查结果，不该进索引", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel("Landing page URL", { exact: true }).fill(EN_URL);
    await page.getByRole("button", { name: /Check this page/i }).click();
    await page.waitForURL(/\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
  });

  // 生产走查发现的真实缺陷（2026-08-23）：对比表的行标识只有 host，
  // 同域的多张页因此两行同名，报告说「有一张缺隐私政策」却看不出是哪一张。
  // 逻辑本身由 lib/tools/compare.test.ts 守，**这条守的是组件真的用了 label**——
  // 单测拦不住有人把 {row.label} 改回 {row.host}。
  // ⚠️ 额度：EN_URL 已被前面的用例缓存（缓存命中不计限频），所以这条只多花 1 次，
  // 全文件仍在每小时 5 次的预算内。别把两个 URL 都换成新的。
  test("同域多页对比：每行标识必须能区分，不能两行同名", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page
      .getByLabel("Landing page URLs, one per line")
      .fill(`${EN_URL}\n${CMP_URL}`);
    await page.getByRole("button", { name: /Compare pages/i }).click();

    await page.waitForURL(/\/tools\/landing-page-check\/b\/[A-Za-z0-9]+$/, { timeout: 60_000 });

    // 两行同 host，只有 query 不同——修复前这里会是两个一模一样的 example.com。
    await expect(page.getByRole("rowheader", { name: /example\.com\/\?e2e=en/ })).toBeVisible();
    await expect(page.getByRole("rowheader", { name: /example\.com\/\?e2e=cmp/ })).toBeVisible();
  });

  test("非法地址在前端给出可读提示，不跳转", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel("Landing page URL", { exact: true }).fill("http://example.com/");
    await page.getByRole("button", { name: /Check this page/i }).click();
    // 用具体 id 而非 role=alert：Next 的路由播报器同样是 role="alert"，会撞上严格模式。
    await expect(page.locator("#page-check-error")).toContainText(/https/i);
    await expect(page).toHaveURL(/\/tools\/landing-page-check$/);
  });

  test("匿名用户看到的是「登录后实测」，而不是会失败的按钮", async ({ page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel("Landing page URL", { exact: true }).fill(EN_URL);
    await page.getByRole("button", { name: /Check this page/i }).click();
    await page.waitForURL(/\/r\/[A-Za-z0-9]+$/, { timeout: 45_000 });
    // 楔子：把「疑似 → 实测」作为登录理由说清楚
    await expect(page.getByRole("link", { name: /Sign in to verify/i })).toBeVisible();
    await expect(page.getByRole("button", { name: /Run a real browser check/i })).toHaveCount(0);
  });

  test("未登录直接调实测接口返回 401", async ({ request, page }) => {
    await page.goto("/tools/landing-page-check");
    await page.getByLabel("Landing page URL", { exact: true }).fill(EN_URL);
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
