// e2e/gallery-and-pages.spec.ts
// 画廊三维筛选 + 落地页复制 / 行内改名 happy-path。
// Dev Login 建会话；beforeAll/afterAll 用 pg 备好/清理 dev 用户落地页（pro 套餐留足额度）。
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

let pool: Pool;
let devUserId: string;

test.describe("画廊筛选 + 落地页复制/改名", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

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

  test("画廊三维筛选 + 搜索", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    await page.goto("/admin/editor");
    // 初始全量：至少能看到 Aurae Skincare
    await expect(page.getByText("Aurae Skincare")).toBeVisible();
    // 搜索 footwear → 命中 Atlas Footwear，Aurae 消失
    await page.getByPlaceholder("搜索模板名称…").fill("footwear");
    await expect(page.getByText("Atlas Footwear")).toBeVisible();
    await expect(page.getByText("Aurae Skincare")).toHaveCount(0);
    // 清空搜索框后恢复
    await page.getByPlaceholder("搜索模板名称…").fill("");
    await expect(page.getByText("Aurae Skincare")).toBeVisible();
  });

  test("复制为草稿 + 行内改名", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // 先建一页（画廊首张「空白开始」）
    await page.goto("/admin/editor");
    await page.getByRole("button", { name: "空白开始" }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    // 列表：复制 → 出现「副本」草稿
    await page.goto("/admin/landing-pages");
    await page.getByText("复制", { exact: true }).first().click();
    await expect(page.getByText(/副本/)).toBeVisible({ timeout: 15_000 });

    // 行内改名：把第一行名称改为唯一串
    // antd 5 Typography.Text editable 渲染一个 .ant-typography-edit 触发按钮，
    // 点击后在原位换出一个 textarea。
    const unique = `重命名页_${Date.now()}`;
    const firstRow = page.locator("tbody tr").first();
    await firstRow.locator(".ant-typography-edit").first().click();
    const editArea = firstRow.locator("textarea");
    await expect(editArea).toBeVisible({ timeout: 10_000 });
    await editArea.fill(unique);
    await editArea.press("Enter");
    await expect(page.getByText(unique)).toBeVisible({ timeout: 15_000 });
  });
});
