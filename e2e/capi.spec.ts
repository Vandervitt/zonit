// e2e/capi.spec.ts
// CAPI：配了凭据 + lead 提交（带 event_id, consent=true）→ capi_events 落库并(经 fake)标记 sent；payload 中 email 为哈希非明文。
// 直接 POST /api/leads（dev 同源）；凭据用 pg 直插（绕过登录态的凭据写接口）。
import { test, expect, request as pwRequest } from "@playwright/test";
import { Pool } from "pg";
import { createHash } from "node:crypto";
import { config as loadEnv } from "dotenv";

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
      data: { pageId, channel: "form", fields: { email: "Tom@Example.com", whatsapp: "+1 555 0100" },
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

  test("cron 端点无 secret → 401", async () => {
    const api = await pwRequest.newContext();
    const r = await api.get(`${BASE}/api/cron/capi-flush`);
    expect(r.status()).toBe(401);
    await api.dispose();
  });
});
