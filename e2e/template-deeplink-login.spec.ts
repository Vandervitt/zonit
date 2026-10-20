// e2e/template-deeplink-login.spec.ts
// 未登录访客在模板详情页点「用这个模板开始」→ 登录/注册 → 必须落到**已按该模板建好的编辑器**。
// 回归 2026-10-20 实测揪出的断点：原先跳 /login 时丢掉原地址、登录后一律进 /admin，模板选择丢失；
// 且从中文页进来却看到英文登录页。这里走真实 UI（中文面 + 验证码新建号），不靠 Dev Login 捷径。
// 同一条链路顺带验证获客归因：注册首触来源（含 utm）与建页模板 id 均落库。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { getDictionary } from "@/lib/i18n/dictionaries";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const EMAIL = `e2e-deeplink-${Date.now()}@qq.com`;

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;

async function cleanup() {
  await pool.query(`DELETE FROM landing_pages WHERE user_id IN (SELECT id FROM users WHERE email = $1)`, [EMAIL]);
  await pool.query(`DELETE FROM email_otps WHERE email = $1`, [EMAIL]);
  await pool.query(`DELETE FROM users WHERE email = $1`, [EMAIL]);
}

test.describe("模板深链登录后回到模板", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    await cleanup();
  });

  test.afterAll(async () => {
    if (pool) {
      await cleanup();
      await pool.end();
    }
  });

  test("中文模板页 → 中文登录页 → 验证码新建号 → 进入该模板的编辑器", async ({ page }) => {
    const zh = getDictionary("zh");

    await page.goto("/zh/templates/b2b-sourcing?utm_source=xhs&utm_campaign=rfq");
    await page.getByRole("link", { name: zh.templates.detail.useTemplate }).click();

    // 中文来源 → 中文登录页，且带着模板深链作回跳
    await page.waitForURL(/\/zh\/login\?callbackUrl=/, { timeout: 30_000 });
    expect(new URL(page.url()).searchParams.get("callbackUrl")).toBe("/admin/landing-pages?template=b2b-sourcing");

    const otp = zh.auth.otp;
    await page.getByLabel(otp.emailLabel).first().fill(EMAIL);
    await page.getByRole("button", { name: otp.sendCode }).click();
    await expect(page.getByLabel(otp.codeLabel)).toHaveValue(/^\d{6}$/, { timeout: 10_000 });
    await page.getByRole("button", { name: otp.submit }).click();

    // 回到深链 → 自动按模板建草稿 → 进编辑器
    await page.waitForURL(/\/admin\/editor\//, { timeout: 60_000 });

    // 从中文入口注册的新用户，后台也必须是中文（字面量断言，不引字典）
    await expect(page.getByRole("button", { name: "AI 一键成页" })).toBeVisible({ timeout: 30_000 });
    const pages = await pool.query(
      `SELECT lp.name, lp.template_id FROM landing_pages lp JOIN users u ON u.id = lp.user_id WHERE u.email = $1`,
      [EMAIL],
    );
    expect(pages.rows).toEqual([{ name: "Meridian Sourcing", template_id: "b2b-sourcing" }]);

    // 首触来源由后台异步补报，轮询等它落库
    await expect
      .poll(async () => {
        const r = await pool.query(`SELECT signup_source FROM users WHERE email = $1`, [EMAIL]);
        return r.rows[0]?.signup_source ?? null;
      }, { timeout: 15_000 })
      .toMatchObject({
        landing: "/zh/templates/b2b-sourcing",
        referrer: null,
        utm: { utm_source: "xhs", utm_campaign: "rfq" },
      });
  });
});
