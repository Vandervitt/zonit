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
    // ⚠️ 必须同时 stub 列表接口：素材库用 SWR 的 mutate(optimistic) 更新网格，随后会
    // **重新拉取** /api/media。只 stub POST 的话，导入项在 revalidate 后被真实（空）
    // 列表覆盖 —— 断言时有时无，全量跑时最容易踩到。这里用一个本地数组充当服务端状态：
    // GET 读它，POST 往里塞，行为与真实后端一致，断言才是确定的。
    const serverMedia: unknown[] = [];
    const imported = {
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
    };
    await page.route("**/api/media?**", (route) =>
      route.fulfill({ json: serverMedia }),
    );
    await page.route("**/api/media", (route) =>
      route.request().method() === "GET"
        ? route.fulfill({ json: serverMedia })
        : route.continue(),
    );
    await page.route("**/api/media/unsplash", (route) => {
      serverMedia.unshift(imported);
      return route.fulfill({ status: 201, json: imported });
    });

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

    // 导入成功提示出现后再关弹窗，避免在请求飞行中按 Escape 打断导入。
    await expect(page.getByText("已添加到素材库")).toBeVisible({ timeout: 10_000 });
    await page.keyboard.press("Escape");
    await expect(page.getByRole("link", { name: "E2E Author" })).toBeVisible({ timeout: 10_000 });
  });
});
