// e2e/page-check-expiry.spec.ts
//
// 外发报告链接的两件事：过期不能是死胡同，打开要留下记录。
//
// 这两个状态都没有 UI 路径能造出来（过期要等 30 天，浏览记录要有人来访问），
// 所以本文件直接写库构造前置状态，需要 RUN_DB_E2E=1。
import { test, expect } from "@playwright/test";
import { dbQuery, isDbE2EEnabled } from "./helpers/db";

const CHECKED_URL = "https://e2e-expiry.example.com/offer?a=1&b=2";

/** 用固定前缀的 id，便于清理，也避免撞上真实报告。 */
const EXPIRED_ID = "e2eExpiredReport00001";
const LIVE_ID = "e2eLiveReport00000001";

test.describe("自检报告的过期与浏览记录", () => {
  test.skip(!isDbE2EEnabled, "需要 RUN_DB_E2E=1");

  test.beforeEach(async () => {
    await dbQuery(`DELETE FROM page_check_reports WHERE id = ANY($1)`, [[EXPIRED_ID, LIVE_ID]]);
    await dbQuery(
      `INSERT INTO page_check_reports
         (id, input_url, final_url, host, locale, status, bytes, hops, findings, ip_hash, expires_at)
       VALUES ($1, $2, $2, 'e2e-expiry.example.com', 'en', 200, 1024, 0, '[]'::jsonb, 'e2e-creator',
               now() - interval '3 days')`,
      [EXPIRED_ID, CHECKED_URL],
    );
    await dbQuery(
      `INSERT INTO page_check_reports
         (id, input_url, final_url, host, locale, status, bytes, hops, findings, ip_hash, expires_at)
       VALUES ($1, $2, $2, 'e2e-expiry.example.com', 'en', 200, 1024, 0, '[]'::jsonb, 'e2e-creator',
               now() + interval '30 days')`,
      [LIVE_ID, CHECKED_URL],
    );
  });

  test.afterAll(async () => {
    await dbQuery(`DELETE FROM page_check_reports WHERE id = ANY($1)`, [[EXPIRED_ID, LIVE_ID]]);
  });

  test("过期报告不是 404，而是带着原始 URL 的重查入口", async ({ page }) => {
    const res = await page.goto(`/tools/landing-page-check/r/${EXPIRED_ID}`);
    // 这是本用例的核心：过期链接必须仍然返回 200。
    expect(res?.status()).toBe(200);

    await expect(page.getByRole("heading", { level: 1 })).toContainText(/expired/i);
    // 过期页必须说出当初查的是哪个页面，否则收件人认不出这封信讲的是什么。
    await expect(page.getByText(CHECKED_URL)).toBeVisible();
    // 过期后不得再展示旧结论。
    await expect(page.getByText(/not a verdict/i)).toHaveCount(0);
  });

  test("重查入口把原始 URL 预填回自检器", async ({ page }) => {
    await page.goto(`/tools/landing-page-check/r/${EXPIRED_ID}`);
    await page.getByRole("link", { name: /Check this page again/i }).click();
    await page.waitForURL(/\/tools\/landing-page-check\?url=/);
    await expect(page.getByLabel("Landing page URL", { exact: true })).toHaveValue(CHECKED_URL);
  });

  test("被硬删除的报告仍然是 404", async ({ page }) => {
    // 软过期不等于永久保留：行被清掉之后该 404 还是要 404。
    const res = await page.goto("/tools/landing-page-check/r/e2eNeverExisted0001x");
    expect(res?.status()).toBe(404);
  });

  test("打开报告会留下一条浏览记录", async ({ page }) => {
    await page.goto(`/tools/landing-page-check/r/${LIVE_ID}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const rows = await dbQuery<{ is_bot: boolean; is_creator: boolean }>(
      `SELECT is_bot, is_creator FROM page_check_report_views WHERE report_id = $1`,
      [LIVE_ID],
    );
    expect(rows.length).toBeGreaterThan(0);
    // 真实浏览器不该被判成机器人——判错方向会让整份触达数据不可用。
    expect(rows.some((r) => !r.is_bot)).toBe(true);
    // fixture 的创建者哈希是编造的，浏览器 IP 不可能与之相同。
    expect(rows.every((r) => !r.is_creator)).toBe(true);
  });

  test("过期报告的访问同样被记录", async ({ page }) => {
    // 链接过期后还回头来看，是比首次打开更强的信号，不能不记。
    await page.goto(`/tools/landing-page-check/r/${EXPIRED_ID}`);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const rows = await dbQuery(
      `SELECT id FROM page_check_report_views WHERE report_id = $1`,
      [EXPIRED_ID],
    );
    expect(rows.length).toBeGreaterThan(0);
  });
});
