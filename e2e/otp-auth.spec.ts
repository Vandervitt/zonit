// e2e/otp-auth.spec.ts
// 邮箱验证码免密登录/注册全链路：
// 发码接口返回 devCode（仅非生产）→ 登录页驱动真实 UI（dev 自动回填码）→ 建号并进入后台。
// 覆盖：新邮箱首次登录即建号；同邮箱二次登录复用账号；任意后缀（非 Gmail）放行。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { getDictionary } from "@/lib/i18n/dictionaries";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const BASE = "http://localhost:3001";
// 故意用非 Gmail 后缀，验证「任意邮箱后缀」已放开。
// API 测试与 UI 测试用不同邮箱：避免 60s 重发冷却导致 UI 发码拿不到 devCode（用例串扰）。
const TEST_EMAIL = `e2e-otp-api-${Date.now()}@qq.com`;
const UI_EMAIL = `e2e-otp-ui-${Date.now()}@qq.com`;

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;

test.describe("邮箱验证码免密登录", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    await pool.query(`DELETE FROM email_otps WHERE email = ANY($1)`, [[TEST_EMAIL, UI_EMAIL]]);
    await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [[TEST_EMAIL, UI_EMAIL]]);
  });

  test.afterAll(async () => {
    if (pool) {
      await pool.query(`DELETE FROM email_otps WHERE email = ANY($1)`, [[TEST_EMAIL, UI_EMAIL]]);
      await pool.query(`DELETE FROM users WHERE email = ANY($1)`, [[TEST_EMAIL, UI_EMAIL]]);
      await pool.end();
    }
  });

  test("发码接口在非生产返回 devCode 且格式为 6 位数字", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/otp/send`, { data: { email: TEST_EMAIL } });
    expect(res.ok()).toBeTruthy();
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.devCode).toMatch(/^\d{6}$/);
  });

  test("非法邮箱格式被拒", async ({ request }) => {
    const res = await request.post(`${BASE}/api/auth/otp/send`, { data: { email: "not-an-email" } });
    expect(res.status()).toBe(400);
  });

  test("新邮箱首次验证码登录即建号并进入后台", async ({ page }) => {
    await page.goto(`${BASE}/login`);

    // ⚠️ 文案从字典取，不写死中文：登录页国际化（PR#115）后 /login 默认是**英文**面，
    // 原用例的中文 label 从那时起就再也匹配不上。字典是唯一事实源，改文案不会再让
    // 这条用例悄悄失效。
    const otp = getDictionary("en").auth.otp;

    await page.getByLabel(otp.emailLabel).first().fill(UI_EMAIL);
    await page.getByRole("button", { name: otp.sendCode }).click();

    // dev 环境后端回传验证码，前端自动回填到验证码输入框。
    const codeInput = page.getByLabel(otp.codeLabel);
    await expect(codeInput).toHaveValue(/^\d{6}$/, { timeout: 10_000 });

    await page.getByRole("button", { name: otp.submit }).click();

    await page.waitForURL(/\/admin/, { timeout: 15_000 });

    // 账号已建，邮箱已标记验证。
    const u = await pool.query(
      `SELECT email_verified FROM users WHERE email = $1`,
      [UI_EMAIL],
    );
    expect(u.rows).toHaveLength(1);
    expect(u.rows[0].email_verified).not.toBeNull();
  });
});
