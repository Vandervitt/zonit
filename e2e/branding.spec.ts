// e2e/branding.spec.ts
// 品牌主题：切到 rose 主题 → 预览 CTA 含 rose 渐变 class；填 logo URL → 预览 Hero 出现 logo。
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

test.describe("品牌主题", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const res = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan='pro' RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("切主题 + Logo 反映到预览", async ({ page }) => {
    // 冷启动 dev server 首次编译路由可能超过默认 30s，放宽整体超时。
    test.setTimeout(90_000);

    // 模板画廊与预览都引用大量外链图片（Unsplash 等）。这些请求在测试环境可能长时间挂起，
    // 既会卡住 "load" 事件，也会抢占浏览器连接、拖慢 JS 注水。直接 abort 外链图片，让
    // 页面快速可交互；img 元素仍会留在 DOM（断言用 toBeAttached，不依赖图片字节加载成功）。
    await page.route("**/*", (route) => {
      const req = route.request();
      const url = req.url();
      const isExternalImage =
        req.resourceType() === "image" && !url.includes("localhost") && !url.includes("127.0.0.1");
      return isExternalImage ? route.abort() : route.continue();
    });

    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    await page.goto("/admin/editor", { waitUntil: "domcontentloaded" });
    await page.getByRole("button", { name: "空白开始" }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000, waitUntil: "domcontentloaded" });

    // 打开「品牌主题」面板：左栏 BlockList 的常驻入口（button，含「配色 / Logo」副标，
    // 故可访问名为「品牌主题配色 / Logo」，用子串匹配；role=button 与右栏面板的 h2 标题区分）。
    await page.getByRole("button", { name: /品牌主题/ }).click();

    // 右栏面板容器：以「品牌主题」标题所在的 <main> 为 scope（避免 Hero 等其他面板的 MediaPicker 误命中）
    const panel = page.locator("main", { has: page.getByRole("heading", { name: "品牌主题" }) });
    await expect(panel).toBeVisible();

    // 点「玫红」色卡 → 切到 rose 主题（exact 避免与其它色卡按钮的累积可访问名歧义）
    await panel.getByRole("button", { name: "玫红", exact: true }).click();

    // 预览 iframe 的 CTA 主按钮 class 含 rose 渐变（非图片元素，正常可见性断言）
    const frame = page.frameLocator('iframe[title="落地页实时预览"]');
    await expect(frame.locator('[class*="from-rose-500"]').first()).toBeVisible({ timeout: 15_000 });

    // 填 Logo URL → 预览 Hero 渲染出该 logo img（断言元素挂载：证明 branding.logo 已透传到 Hero）
    const logoUrl = "https://images.unsplash.com/photo-1599305445671-ac291c95aaa9?w=200";
    // 品牌 Logo 是面板内第一个 MediaPicker，其文本框为面板内首个 textbox（favicon 为第二个）
    const logoInput = panel.getByRole("textbox").first();
    await logoInput.fill(logoUrl);
    await expect(frame.locator(`img[src="${logoUrl}"]`).first()).toBeAttached({ timeout: 15_000 });
  });
});
