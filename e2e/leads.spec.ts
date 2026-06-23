// e2e/leads.spec.ts
// 线索闭环：公开提交入库 → 后台收件箱可见 → 标记已读；honeypot/无联系方式反例。
// Dev Login 建会话；直接 POST /api/leads（dev 同源）验证公开提交，避免依赖真实自有域名路由。
import { test, expect, request as pwRequest } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";
const BASE = "http://localhost:3001";

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;
let pageId: string;

test.describe("线索闭环", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const u = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan='pro' RETURNING id`, [DEV_EMAIL]);
    devUserId = u.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    const p = await pool.query(
      `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, 'Lead 测试页', '{}'::jsonb) RETURNING id`, [devUserId]);
    pageId = p.rows[0].id;
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("公开提交入库 + 校验反例", async () => {
    const api = await pwRequest.newContext();
    // 正常提交（有 whatsapp 联系方式）
    const ok = await api.post(`${BASE}/api/leads`, {
      data: { pageId, channel: "form", fields: { name: "Tom", whatsapp: "+1 555 0100", message: "hi" }, utm: { utm_source: "fb" } },
    });
    expect(ok.status()).toBe(204);
    // honeypot 命中 → 静默 204 但不入库
    await api.post(`${BASE}/api/leads`, { data: { pageId, fields: { whatsapp: "+1 999" }, company_url: "bot" } });
    // 无联系方式 → 400
    const bad = await api.post(`${BASE}/api/leads`, { data: { pageId, fields: { name: "NoContact" } } });
    expect(bad.status()).toBe(400);

    // DB 校验：该页只有 1 条 lead（honeypot 与 400 都没入库）
    const cnt = await pool.query(`SELECT COUNT(*)::int n FROM leads WHERE page_id = $1`, [pageId]);
    expect(cnt.rows[0].n).toBe(1);
    await api.dispose();
  });

  test("后台收件箱可见 + 标记已读", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    await page.goto("/admin/leads");
    // 线索行可见（页面名）
    const row = page.getByRole("row").filter({ hasText: "Lead 测试页" });
    await expect(row).toBeVisible({ timeout: 15_000 });
    // 状态列初始为「未读」（antd Tag 渲染为该行内的元素）
    await expect(row.getByText("未读", { exact: true })).toBeVisible();
    // 点击操作列的「标已读」（exact 区分于状态 Tag 的「已读」文案）
    await row.getByText("标已读", { exact: true }).click();
    // 标已读后状态列变「已读」
    await expect(row.getByText("已读", { exact: true })).toBeVisible({ timeout: 15_000 });
    // 且操作列文案翻转为「标未读」，进一步确认状态确实切换
    await expect(row.getByText("标未读", { exact: true })).toBeVisible();
  });
});
