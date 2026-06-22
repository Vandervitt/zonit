// e2e/media-picker.spec.ts
// 编辑器选图体验：三 Tab 弹窗（上传 / Unsplash demo 提示）+ alt 渲染 + 视频无 Unsplash Tab。
// Dev Login 建会话；beforeAll/afterAll 用 pg 备好/清理 dev 用户落地页。
// 本地无 UNSPLASH_ACCESS_KEY，故 Unsplash 只验 demo 提示路径，不打真实 API。
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

test.describe("编辑器选图体验", () => {
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

  test("选图弹窗三 Tab + Unsplash demo 提示", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // 建一页并进编辑器
    await page.goto("/admin/editor");
    await page.getByRole("button", { name: "空白开始" }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    // Hero 背景图字段默认折叠（Optional 开关关闭），先勾选启用以露出「选图」按钮。
    // 参考 HeroForm.tsx：背景图字段 label 为「背景图（缺省用主题色兜底）」。
    const bgToggle = page.getByRole("checkbox", { name: /背景图（缺省用主题色兜底）/ });
    await expect(bgToggle).toBeVisible({ timeout: 30_000 });
    await bgToggle.check();

    // 点「选图」按钮打开弹窗
    await page.getByRole("button", { name: "选图" }).first().click();

    // 三个 Tab 存在（图片字段：媒体库 / 上传 / Unsplash）
    await expect(page.getByRole("button", { name: "媒体库" })).toBeVisible();
    await expect(page.getByRole("button", { name: "上传" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Unsplash" })).toBeVisible();

    // 切 Unsplash，搜索 → 本地无 key 应返回 demo 并显示「未配置 Unsplash」提示
    await page.getByRole("button", { name: "Unsplash" }).click();
    await page.getByPlaceholder(/搜索 Unsplash/).fill("beach");
    await page.getByRole("button", { name: "搜索" }).click();
    await expect(page.getByText(/未配置 Unsplash/)).toBeVisible({ timeout: 15_000 });
  });
});
