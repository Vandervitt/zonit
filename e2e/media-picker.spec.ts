// e2e/media-picker.spec.ts
// 编辑器选图体验：三 Tab 弹窗（上传 / Unsplash demo 提示）+ alt 渲染 + 视频无 Unsplash Tab。
// Dev Login 建会话；beforeAll/afterAll 用 pg 备好/清理 dev 用户落地页。
// 本地无 UNSPLASH_ACCESS_KEY，故 Unsplash 只验 demo 提示路径，不打真实 API。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { createPageFromTemplate, devLogin, selectPanel } from "./helpers/editor";

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
    await devLogin(page);
    await createPageFromTemplate(page);

    // 新建页默认选中「联系方式」面板，先切到首屏才有背景图字段。
    await selectPanel(page, /首屏 Hero/);

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

    // 切 Unsplash 并搜索。
    // ⚠️ 断言必须覆盖两种落点：配了 UNSPLASH key 的机器会返回真实结果，没配的返回
    // demo 提示。原来只断言「未配置 Unsplash」，于是在**有** key 的开发机上必红
    // ——这是环境依赖，不是产品缺陷。这里只要求搜索有确定结果、且不是失败态。
    await page.getByRole("button", { name: "Unsplash" }).click();
    await page.getByPlaceholder(/搜索 Unsplash/).fill("beach");
    await page.getByRole("button", { name: "搜索" }).click();
    const settled = page
      .getByText(/未配置 Unsplash/)
      .or(page.getByRole("button", { name: /添加 Unsplash 图片/ }).first());
    await expect(settled.first()).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText("搜索失败，请重试")).toHaveCount(0);
  });
});
