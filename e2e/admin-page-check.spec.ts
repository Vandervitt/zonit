// e2e/admin-page-check.spec.ts
// 后台侧自检：对自己已发布的页跑公开自检器的同一套检查。
//
// 覆盖的是「检查哪张页」这一层判定——检查逻辑本身已由 e2e/page-check.spec.ts 覆盖，
// 这里不重复。真正容易错且后果严重的是：拿预览地址去检查、对草稿也放行、
// 或者别人的页也能检查。
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { devLogin } from "./helpers/editor";
import { t } from "./helpers/i18n";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";
// 用真实可达的公开域名做 fixture：自检器真的会去抓这个地址。
const LIVE_DOMAIN = "example.com";

function makePool(): Pool {
  const cs = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = cs.includes("localhost") || cs.includes("127.0.0.1");
  return new Pool({ connectionString: cs, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;
let publishedId: string;
let draftId: string;

test.describe("后台落地页自检", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");
  // 首次真检查要付 next dev 冷编译 + 真实抓取外站两笔时间。
  test.setTimeout(90_000);

  test.beforeAll(async () => {
    pool = makePool();
    const u = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan='pro' RETURNING id`, [DEV_EMAIL]);
    devUserId = u.rows[0].id;
    await pool.query(`DELETE FROM domains WHERE domain = $1`, [LIVE_DOMAIN]);
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);

    const pub = await pool.query(
      `INSERT INTO landing_pages (user_id, name, status, data, published_at)
       VALUES ($1, '自检-已发布页', 'published', '{}'::jsonb, NOW()) RETURNING id`, [devUserId]);
    publishedId = pub.rows[0].id;
    const draft = await pool.query(
      `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, '自检-草稿页', '{}'::jsonb) RETURNING id`, [devUserId]);
    draftId = draft.rows[0].id;

    const domain = await pool.query(
      `INSERT INTO domains (user_id, domain, enabled, verified, landing_page_id)
       VALUES ($1, $2, true, true, $3) RETURNING id`, [devUserId, LIVE_DOMAIN, publishedId]);
    await pool.query(
      `INSERT INTO domain_routes (domain_id, path, landing_page_id) VALUES ($1, '/', $2)`,
      [domain.rows[0].id, publishedId]);
  });

  test.afterAll(async () => {
    await pool.query(`DELETE FROM domains WHERE domain = $1`, [LIVE_DOMAIN]);
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("未登录不得使用", async ({ request }) => {
    const res = await request.post(`/api/landing-pages/${publishedId}/check`);
    expect(res.status()).toBe(401);
  });

  test("草稿页拒绝：没有线上地址，检查预览地址等于检查一个访客打不开的 URL", async ({ page }) => {
    await devLogin(page);
    const res = await page.request.post(`/api/landing-pages/${draftId}/check`);
    expect(res.status()).toBe(400);
    expect((await res.json()).error).toBe("not_published");
  });

  test("别人的页查不了", async ({ page }) => {
    await devLogin(page);
    const other = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ('other-check@localhost','Other','free')
       ON CONFLICT (email) DO UPDATE SET plan='free' RETURNING id`);
    const theirs = await pool.query(
      `INSERT INTO landing_pages (user_id, name, status, data) VALUES ($1,'别人的页','published','{}'::jsonb) RETURNING id`,
      [other.rows[0].id]);
    const res = await page.request.post(`/api/landing-pages/${theirs.rows[0].id}/check`);
    expect(res.status()).toBe(404);
    await pool.query(`DELETE FROM users WHERE id = $1`, [other.rows[0].id]);
  });

  test("已发布页：从列表点自检 → 报告落库并可打开", async ({ page }) => {
    await devLogin(page);

    // 检查打在绑定域名上，而不是预览地址
    const res = await page.request.post(`/api/landing-pages/${publishedId}/check`);
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(body.url).toBe(`https://${LIVE_DOMAIN}`);
    expect(body.id).toMatch(/^[A-Za-z0-9]{21}$/);

    const stored = await pool.query(`SELECT input_url FROM page_check_reports WHERE id = $1`, [body.id]);
    expect(stored.rows[0].input_url).toContain(LIVE_DOMAIN);

    // 报告页复用公开报告页，免责声明照常在场（后台入口不得绕过「不下判定」红线）
    await page.goto(`/tools/landing-page-check/r/${body.id}`);
    await expect(page.getByText(/不是判定|not a verdict/i)).toBeVisible({ timeout: 15_000 });

    // 列表页上，已发布行有自检入口、草稿行没有
    await page.goto("/admin/landing-pages");
    const pubRow = page.getByRole("row").filter({ hasText: "自检-已发布页" });
    await expect(pubRow.getByText(t.pages.actions.check, { exact: true })).toBeVisible({ timeout: 15_000 });
    const draftRow = page.getByRole("row").filter({ hasText: "自检-草稿页" });
    await expect(draftRow.getByText(t.pages.actions.check, { exact: true })).toHaveCount(0);
  });
});
