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

  // 打开「新建」模板弹窗。按钮在 hydration 完成前就已可点，过早点击会静默丢失，
  // 故重试「点击 + 断言弹窗已开」而不是赌固定等待。
  async function openTemplateDialog(page: import("@playwright/test").Page) {
    await page.goto("/admin/landing-pages");
    const dialog = page.getByRole("dialog");
    await expect(async () => {
      await page.getByRole("button", { name: "新建" }).click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    return dialog;
  }

  test("模板弹窗内搜索筛选", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // ⚠️ 模板画廊已不是独立路由：原来的 /admin/editor 画廊页早已移除（现在只有
    // /admin/editor/[id]），画廊改为落地页列表「新建」唤起的弹窗。本用例曾长期
    // 因为访问那条已删路由而红着。
    const dialog = await openTemplateDialog(page);

    // 初始全量：至少能看到 Aurae Skincare
    await expect(dialog.getByText("Aurae Skincare")).toBeVisible();
    // 搜索 footwear → 命中 Atlas Footwear，Aurae 消失
    const search = dialog.getByRole("searchbox", { name: "搜索模板名称" });
    await search.fill("footwear");
    await expect(dialog.getByText("Atlas Footwear")).toBeVisible();
    await expect(dialog.getByText("Aurae Skincare")).toHaveCount(0);
    // 清空搜索框后恢复
    await search.fill("");
    await expect(dialog.getByText("Aurae Skincare")).toBeVisible();
  });

  test("复制为草稿 + 行内改名", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // 先建一页（模板弹窗「直接编辑」；「空白开始」入口已随画廊页一并移除）
    const dialog = await openTemplateDialog(page);
    await dialog.getByRole("searchbox", { name: "搜索模板名称" }).fill("Aurae Skincare");
    await dialog.getByRole("button", { name: "直接编辑" }).first().click();
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
