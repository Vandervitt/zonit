// e2e/leads.spec.ts
// 线索闭环：公开提交入库 → 后台收件箱可见 → 标记已读；honeypot/无联系方式反例。
// Dev Login 建会话；直接 POST /api/leads（dev 同源）验证公开提交，避免依赖真实自有域名路由。
import { test, expect, request as pwRequest } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
// 提醒的筛选口径全在 SQL 里，直接用应用侧实现对真实库跑一次（单测只能断言参数）。
import { computeLeadNudges } from "@/lib/leads/nudge";
import appPool from "@/lib/db";

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

  // 限频已改为落库计数（跨实例共享）。e2e 的请求全部来自同一 IP，
  // 不清理会让后面的用例撞上 429——这正说明限频真的生效了。
  test.beforeEach(async () => {
    await pool.query(`DELETE FROM rate_limit_hits`);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.query(`DELETE FROM rate_limit_hits`);
    await pool.end();
    await appPool.end(); // 应用侧连接池（未读提醒用例用）同样要关，否则进程不退出
  });

  test("公开提交入库 + 校验反例", async () => {
    const api = await pwRequest.newContext();
    // 正常提交（whatsapp 为表单拼好的 E.164）
    const ok = await api.post(`${BASE}/api/leads`, {
      data: { pageId, channel: "form", fields: { name: "Tom", whatsapp: "+15550100999", message: "hi" }, utm: { utm_source: "fb" } },
    });
    expect(ok.status()).toBe(204);
    // 缺国码 / 带格式符的号码 → 400（表单强制携带国码，落库一律 E.164）
    const noDial = await api.post(`${BASE}/api/leads`, { data: { pageId, fields: { whatsapp: "555 0100" } } });
    expect(noDial.status()).toBe(400);
    // Telegram 填手机号 → 400（t.me 跳不了手机号）
    const badTg = await api.post(`${BASE}/api/leads`, { data: { pageId, fields: { telegram: "13800138000" } } });
    expect(badTg.status()).toBe(400);
    // honeypot 命中 → 静默 204 但不入库
    await api.post(`${BASE}/api/leads`, { data: { pageId, fields: { whatsapp: "+15559990000" }, company_url: "bot" } });
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

  test("一键联系：渠道链接可点 + 点击即自动标已读", async ({ page }) => {
    // 独立线索（用 utm_source 认行，避免和前面用例的线索混淆）
    const api = await pwRequest.newContext();
    const res = await api.post(`${BASE}/api/leads`, {
      data: {
        pageId,
        channel: "form",
        fields: { name: "Contact Test", email: "contact@example.com", whatsapp: "+8613800138000" },
        utm: { utm_source: "e2e-contact" },
      },
    });
    expect(res.status()).toBe(204);
    await api.dispose();

    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });
    await page.goto("/admin/leads");

    const row = page.getByRole("row").filter({ hasText: "e2e-contact" });
    await expect(row).toBeVisible({ timeout: 15_000 });

    // WhatsApp 链接指向 wa.me 且号码去掉了 +（E.164 由表单侧保证）
    await expect(row.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", "https://wa.me/8613800138000");
    // 邮件走 mailto（同标签页，点击不会跳外站，适合在 e2e 里验证副作用）
    const mail = row.getByRole("link", { name: "邮件" });
    await expect(mail).toHaveAttribute("href", "mailto:contact@example.com");

    // 点开渠道即视为已跟进 → 状态自动翻为已读，无需再手动标
    await expect(row.getByText("未读", { exact: true })).toBeVisible();
    await mail.click();
    await expect(row.getByText("已读", { exact: true })).toBeVisible({ timeout: 15_000 });
  });

  test("来源校验：别人的 Origin 灌线索 → 403，自己的域名与无 Origin 放行", async () => {
    const api = await pwRequest.newContext();

    // 冒充别人的站点向本页灌线索
    const forged = await api.post(`${BASE}/api/leads`, {
      headers: { origin: "https://attacker.example" },
      data: { pageId, fields: { whatsapp: "+15550001111" } },
    });
    expect(forged.status()).toBe(403);
    expect(forged.headers()["access-control-allow-origin"]).toBeUndefined(); // 不再回 *

    // 平台主域（预览/编辑器/本地开发都从这里发起）
    const own = await api.post(`${BASE}/api/leads`, {
      headers: { origin: BASE },
      data: { pageId, fields: { whatsapp: "+15550002222" } },
    });
    expect(own.status()).toBe(204);

    // 无 Origin（curl / 服务端调用）：浏览器跨源必带 Origin，拦它没意义，放行
    const noOrigin = await api.post(`${BASE}/api/leads`, {
      data: { pageId, fields: { whatsapp: "+15550003333" } },
    });
    expect(noOrigin.status()).toBe(204);

    // 埋点同口径
    const forgedTrack = await api.post(`${BASE}/api/track`, {
      headers: { origin: "https://attacker.example" },
      data: { pageId, event: "page_view" },
    });
    expect(forgedTrack.status()).toBe(403);

    await api.dispose();
  });

  test("通知送达可见性：邮件结果回写到线索并在后台可见", async ({ page }) => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${BASE}/api/leads`, {
      data: {
        pageId, channel: "form",
        fields: { name: "Notify Test", email: "notify@example.com" },
        utm: { utm_source: "e2e-notify" },
      },
    });
    expect(res.status()).toBe(204);
    await api.dispose();

    // 邮件在响应之后发（next/server after），故轮询等回写落库。
    // 本地 dev 收件人不可达，结果多半是 failed——失败可见正是这条功能的目的。
    await expect
      .poll(async () => {
        const r = await pool.query(
          `SELECT notify_email FROM leads WHERE payload->>'name' = 'Notify Test' ORDER BY created_at DESC LIMIT 1`,
        );
        return r.rows[0]?.notify_email ?? null;
      }, { timeout: 20_000 })
      .toMatch(/^(sent|failed|off)$/);

    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });
    await page.goto("/admin/leads");

    const row = page.getByRole("row").filter({ hasText: "e2e-notify" });
    await expect(row).toBeVisible({ timeout: 15_000 });
    await expect(row.getByText(/^邮件 (已发送|失败|关)$/)).toBeVisible();
  });

  // 提醒的筛选口径全在 SQL 里，单测只能断言参数，故在真实库上验一次。
  test("未读提醒：只挑静置超 48h、未读、未提醒过、且不早于 30 天的线索", async () => {
    const seed = async (payload: object, hoursAgo: number, isRead = false, nudged = false) => {
      const res = await pool.query(
        `INSERT INTO leads (page_id, payload, channel, is_read, nudged_at, created_at)
         VALUES ($1, $2, 'form', $3, $4, NOW() - ($5 || ' hours')::interval) RETURNING id`,
        [pageId, JSON.stringify(payload), isRead, nudged ? new Date() : null, String(hoursAgo)],
      );
      return res.rows[0].id as string;
    };
    await pool.query(`DELETE FROM leads WHERE page_id = $1`, [pageId]);

    const stale = await seed({ name: "Stale", whatsapp: "+15550000001" }, 72);
    await seed({ name: "TooFresh", whatsapp: "+15550000002" }, 3);              // 静置不足 48h
    await seed({ name: "AlreadyRead", whatsapp: "+15550000003" }, 72, true);    // 已读
    await seed({ name: "AlreadyNudged", whatsapp: "+15550000004" }, 72, false, true); // 提醒过
    await seed({ name: "Ancient", whatsapp: "+15550000005" }, 24 * 40);         // 超 30 天

    const nudges = await computeLeadNudges(new Date());
    const mine = nudges.find((n) => n.userId === devUserId);

    expect(mine).toBeDefined();
    expect(mine!.leadIds).toEqual([stale]);
    expect(mine!.leads[0]).toMatchObject({ pageName: "Lead 测试页", contact: "Stale · +15550000001" });
    // 取整 + 库时钟与进程时钟的毫秒级差异，72h 会落在 71~72 之间，不做精确断言
    expect(mine!.leads[0].waitedHours).toBeGreaterThanOrEqual(71);
    expect(mine!.leads[0].waitedHours).toBeLessThan(73);
  });
});
