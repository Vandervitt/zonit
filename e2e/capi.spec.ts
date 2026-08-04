// e2e/capi.spec.ts
// CAPI：配了凭据 + lead 提交（带 event_id, consent=true）→ capi_events 落库并(经 fake)标记 sent；payload 中 email 为哈希非明文。
// 直接 POST /api/leads（dev 同源）；凭据用 pg 直插（绕过登录态的凭据写接口）。
import { request as pwRequest } from "@playwright/test";
import { test, expect } from "./helpers/app-pool";
import { Pool } from "pg";
import { createHash } from "node:crypto";
import { config as loadEnv } from "dotenv";
// 两级凭据的解析顺序全在 SQL 里，直接用应用侧实现对真实库跑一次。
import { getCredentials, listConfiguredProviders } from "@/lib/capi/credentials";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";
const BASE = "http://localhost:3001";

function makePool(): Pool {
  const cs = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = cs.includes("localhost") || cs.includes("127.0.0.1");
  return new Pool({ connectionString: cs, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;
let pageId: string;

test.describe("CAPI 服务端回传", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const u = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan='pro' RETURNING id`, [DEV_EMAIL]);
    devUserId = u.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    const p = await pool.query(
      `INSERT INTO landing_pages (user_id, name, data) VALUES ($1, 'CAPI 测试页', '{}'::jsonb) RETURNING id`, [devUserId]);
    pageId = p.rows[0].id;
    await pool.query(
      `INSERT INTO page_capi_credentials (page_id, provider, access_token, external_id)
       VALUES ($1,'meta','tok','ds1') ON CONFLICT (page_id, provider) DO NOTHING`, [pageId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("lead 提交带 event_id → capi_events 落库（哈希 PII）", async () => {
    const api = await pwRequest.newContext();
    const res = await api.post(`${BASE}/api/leads`, {
      // ⚠️ 号码必须是严格 E.164（无空格）：/api/leads 在国码改造（PR#125）后对
      // 非 E.164 直接 400，本用例原来的 "+1 555 0100" 从那时起就一直红着。
      data: { pageId, channel: "form", fields: { email: "Tom@Example.com", whatsapp: "+15550100" },
              event_id: "evt-capi-1", consent: true },
    });
    expect(res.status()).toBe(204);

    // 轮询等 after()/fake flush 落库（最多 ~5s）
    let row: { status: string; event_id: string; payload: { emailHash?: string } } | undefined;
    for (let i = 0; i < 25 && !row; i++) {
      const r = await pool.query(`SELECT status, event_id, payload FROM capi_events WHERE page_id=$1 AND provider='meta'`, [pageId]);
      row = r.rows[0];
      if (!row) await new Promise((res2) => setTimeout(res2, 200));
    }
    expect(row).toBeTruthy();
    expect(row!.event_id).toBe("evt-capi-1");
    // email 为 SHA-256 哈希，不存明文
    const expectHash = createHash("sha256").update("tom@example.com").digest("hex");
    expect(row!.payload.emailHash).toBe(expectHash);
    await api.dispose();
  });

  // 两级凭据的解析顺序只在 SQL 里，单测断言不到；配错方向的后果是「以为在回传，
  // 其实一条没发」或「用了别的客户的 Dataset」，必须在真实库上验一次。
  test("账号级凭据：未覆盖的页继承账号级，页级覆盖仍然优先", async () => {
    // 该页只配了 meta（页级）。账号级同时配 meta 与 tiktok。
    await pool.query(
      `INSERT INTO user_capi_credentials (user_id, provider, access_token, external_id)
       VALUES ($1,'meta','acct-tok','acct-ds'), ($1,'tiktok','tt-tok','tt-code')
       ON CONFLICT (user_id, provider) DO UPDATE SET external_id = EXCLUDED.external_id`,
      [devUserId],
    );

    const creds = await getCredentials(pageId);
    const byProvider = Object.fromEntries(creds.map((c) => [c.provider, c.externalId]));
    // meta 有页级覆盖 → 用页级的 ds1，不是账号级的 acct-ds
    expect(byProvider.meta).toBe("ds1");
    // tiktok 页级没配 → 继承账号级
    expect(byProvider.tiktok).toBe("tt-code");

    // 前端要能分辨来源，否则用户不知道删除会影响一张页还是全部页
    const scopes = await listConfiguredProviders(pageId);
    expect(scopes).toContainEqual({ provider: "meta", scope: "page" });
    expect(scopes).toContainEqual({ provider: "tiktok", scope: "account" });

    await pool.query(`DELETE FROM user_capi_credentials WHERE user_id = $1`, [devUserId]);
  });

  test("回传健康度：后台能看到已送达/失败与失败原因", async ({ page }) => {
    await pool.query(`DELETE FROM capi_events WHERE page_id = $1`, [pageId]);
    await pool.query(
      `INSERT INTO capi_events (page_id, provider, event_name, event_id, payload, status, attempts, last_error)
       VALUES ($1,'meta','Lead','e1','{}'::jsonb,'sent',1,NULL),
              ($1,'meta','Lead','e2','{}'::jsonb,'failed',5,'OAuthException: Invalid OAuth access token'),
              ($1,'meta','Lead','e3','{}'::jsonb,'pending',1,NULL)`,
      [pageId],
    );

    await page.goto("/login");
    await page.getByRole("button", { name: /Dev Login/i }).click();
    await page.waitForURL("**/admin", { timeout: 30_000 });

    const res = await page.request.get("/api/capi/health?days=30");
    expect(res.status()).toBe(200);
    const body = await res.json();
    // 1 送达 / 1 失败 → 送达率恰好 50%，判 degraded（低于 50% 才升级为 failing）
    expect(body.summary).toMatchObject({ sent: 1, failed: 1, pending: 1, verdict: "degraded" });
    expect(body.providers[0].lastError).toContain("Invalid OAuth access token");

    // 面板上要把原始报错翻成能动手修的说法
    await page.goto("/admin/analytics");
    await expect(page.getByText("服务端回传（CAPI）")).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(/Access Token 无效或已过期/)).toBeVisible();

    await pool.query(`DELETE FROM capi_events WHERE page_id = $1`, [pageId]);
  });

  test("cron 端点无 secret → 401", async () => {
    const api = await pwRequest.newContext();
    const r = await api.get(`${BASE}/api/cron/capi-flush`);
    expect(r.status()).toBe(401);
    await api.dispose();
  });
});
