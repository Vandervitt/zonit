// 草稿分享预览端到端：登录 → 模板弹窗建页 → 生成链接 → 无会话上下文访问断言内容/水印/noindex → 重置后旧链接失效。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

function pathOf(url: string): string {
  return url.startsWith("http") ? new URL(url).pathname : url;
}

test.describe("草稿分享预览", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  let pool: Pool;
  let devUserId: string;

  test.beforeAll(async () => {
    pool = makePool();
    const res = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan = 'pro' RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("生成链接可匿名访问且带水印/noindex；重置后旧链接 404", async ({ page, browser, baseURL }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // 建页：概览页「新建落地页」唤起模板弹窗（已替代旧的独立 /admin/editor 画廊页），
    // 点首张模板卡的「直接编辑」建库并进编辑器。当前无「空白模板」，用首张模板承载分享预览流程即可。
    await page.goto("/admin");
    const trigger = page.getByRole("button", { name: "新建落地页" });
    const dialog = page.getByRole("dialog");
    await trigger.click();
    // antd Button + Radix asChild 偶发首次点击不开弹窗，兜底重试一次。
    if (!(await dialog.isVisible().catch(() => false))) {
      await trigger.click();
    }
    await expect(dialog).toBeVisible({ timeout: 10_000 });
    // 模板卡的「直接编辑」为 hover 浮现按钮（桌面下默认 opacity-0），headless 无真实 hover，
    // 直接派发 click 触发其 onClick（建库并跳转），避免依赖不稳定的悬停可见性。
    const createBtn = dialog.getByRole("button", { name: "直接编辑" }).first();
    await createBtn.waitFor({ state: "attached", timeout: 15_000 });
    await createBtn.dispatchEvent("click");
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    await page.getByRole("button", { name: "分享预览" }).click();
    await page.getByRole("button", { name: "生成分享链接" }).click();
    const input = page.locator("input[readonly]");
    await expect(input).toHaveValue(/\/preview\//, { timeout: 15_000 });
    const firstUrl = await input.inputValue();
    const firstPath = pathOf(firstUrl);

    // 无会话上下文访问
    const anon = await browser.newContext();
    const anonPage = await anon.newPage();
    const resp = await anonPage.goto(baseURL + firstPath);
    expect(resp?.status()).toBe(200);
    expect(resp?.headers()["x-robots-tag"] ?? "").toContain("noindex");
    await expect(anonPage.locator('meta[name="robots"]')).toHaveAttribute("content", /noindex/);
    await expect(anonPage.getByText("Made with")).toBeVisible();

    // 重置链接 → 旧链接 404
    await page.getByRole("button", { name: /重置链接/ }).click();
    await expect(input).not.toHaveValue(firstUrl, { timeout: 15_000 });
    const stalePage = await anon.newPage();
    const staleResp = await stalePage.goto(baseURL + firstPath);
    expect(staleResp?.status()).toBe(404);

    await anon.close();
  });
});
