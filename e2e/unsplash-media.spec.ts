// e2e/unsplash-media.spec.ts
// 素材库页「从 Unsplash 添加」：搜索 → 选图导入 → 新素材出现在网格（带署名角标）。
// stub /api/unsplash/search 与 /api/media/unsplash，避开真实 Unsplash key 与 Blob 依赖。
// 登录沿用 Dev Login（见 media-picker.spec.ts）；DB-backed，需 RUN_DB_E2E=1 + 本地 dev server + Postgres。
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

test.describe("素材库 Unsplash 导入", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const res = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan = 'pro' RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
  });

  test.afterAll(async () => {
    await pool.end();
  });

  test("从 Unsplash 添加图片后出现在网格", async ({ page }) => {
    await page.route("**/api/unsplash/search**", (route) =>
      route.fulfill({
        json: {
          results: [
            {
              id: "e2e1",
              urls: { small: "https://images.unsplash.com/s.jpg", regular: "https://images.unsplash.com/r.jpg" },
              alt_description: "e2e beach",
              downloadLocation: "https://api.unsplash.com/photos/e2e1/download",
              user: {
                name: "E2E Author",
                username: "e2e",
                profileUrl: "https://unsplash.com/@e2e?utm_source=zap_bridge&utm_medium=referral",
              },
            },
          ],
          total: 1,
        },
      }),
    );
    await page.route("**/api/media/unsplash", (route) =>
      route.fulfill({
        status: 201,
        json: {
          id: "mnew",
          userId: devUserId,
          url: "https://blob.example/new.jpg",
          filename: "unsplash-x.jpg",
          type: "image",
          size: 3,
          source: "unsplash",
          creditName: "E2E Author",
          creditUrl: "https://unsplash.com/@e2e?utm_source=zap_bridge&utm_medium=referral",
          createdAt: new Date().toISOString(),
        },
      }),
    );

    // 登录
    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    // 进素材库，打开 Unsplash 弹窗并搜索
    await page.goto("/admin/media");
    await page.getByRole("button", { name: "从 Unsplash 添加" }).click();
    await page.getByLabel("搜索 Unsplash 图片").fill("beach");
    await page.getByLabel("搜索 Unsplash 图片").press("Enter");

    // 点击导入（stub 返回单张，署名 E2E Author）
    await page.getByRole("button", { name: /添加 Unsplash 图片 by E2E Author/ }).click();

    // 关闭弹窗，仅剩网格；网格署名角标是带 creditUrl 的链接，可唯一定位
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "E2E Author" })).toBeVisible({ timeout: 10_000 });
  });
});
