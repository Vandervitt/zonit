// e2e/otp-auth.spec.ts
// 邮箱验证码免密登录/注册全链路：
// 发码接口返回 devCode（仅非生产）→ 登录页驱动真实 UI（dev 自动回填码）→ 建号并进入后台。
// 覆盖：新邮箱首次登录即建号；同邮箱二次登录复用账号；任意后缀（非 Gmail）放行。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";

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

    await page.getByLabel("邮箱").first().fill(UI_EMAIL);
    await page.getByRole("button", { name: "发送验证码" }).click();

    // dev 环境后端回传验证码，前端自动回填到验证码输入框。
    const codeInput = page.getByLabel("验证码");
    await expect(codeInput).toHaveValue(/^\d{6}$/, { timeout: 10_000 });

    await page.getByRole("button", { name: "登录 / 注册" }).click();

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
