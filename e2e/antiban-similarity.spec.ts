// e2e/antiban-similarity.spec.ts
// 反同质化风险读数：名下已发布页的骨架重复情况。
//
// 单测已覆盖归组与计数逻辑，这里只验单测碰不到、且错了后果最重的两条：
//   · 读的必须是 published_data（线上快照），不是草稿——用草稿算等于算了一个线上不存在的风险
//   · 只算已发布页——把草稿算进重复只会制造假警报
import { test, expect } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { devLogin } from "./helpers/editor";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const RUN = process.env.RUN_DB_E2E === "1";
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? "dev@localhost";

function makePool(): Pool {
  const cs = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = cs.includes("localhost") || cs.includes("127.0.0.1");
  return new Pool({ connectionString: cs, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

/** 只有区块骨架有意义，文案一律留空。 */
const draft = (types: string[], variantSeed?: string) => JSON.stringify({
  sections: types.map((type) => ({ type, data: {} })),
  ...(variantSeed ? { variantSeed } : {}),
});

let pool: Pool;
let devUserId: string;

test.describe("反同质化风险读数", () => {
  test.skip(!RUN, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    const u = await pool.query(
      `INSERT INTO users (email, name, plan) VALUES ($1, 'Dev User', 'agency')
       ON CONFLICT (email) DO UPDATE SET plan='agency' RETURNING id`, [DEV_EMAIL]);
    devUserId = u.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.end();
  });

  test("按线上快照归组：草稿改了结构不影响读数，未发布页不参与统计", async ({ page }) => {
    // 两张已发布页，线上快照骨架相同；其中一张的**草稿**已经改成了别的骨架。
    // 正确行为是仍判为重复——访客与平台看到的是快照，不是草稿。
    await pool.query(
      `INSERT INTO landing_pages (user_id, name, status, data, published_data, published_at)
       VALUES ($1,'投放页A','published',$2::jsonb,$3::jsonb,NOW()),
              ($1,'投放页B','published',$3::jsonb,$3::jsonb,NOW())`,
      [devUserId, draft(["reviews", "story"]), draft(["features", "faq"])],
    );
    // 草稿页：骨架与上面两张相同，但没发布 → 不该被算进来
    await pool.query(
      `INSERT INTO landing_pages (user_id, name, data) VALUES ($1,'还没发的草稿',$2::jsonb)`,
      [devUserId, draft(["features", "faq"])],
    );

    await devLogin(page);
    const res = await page.request.get("/api/antiban/similarity");
    expect(res.status()).toBe(200);
    const report = await res.json();

    // 只统计两张已发布页
    expect(report.total).toBe(2);
    expect(report.duplicated).toBe(2);
    expect(report.clusters).toHaveLength(1);
    // 归组依据是线上快照的骨架，不是 A 的草稿骨架
    expect(report.clusters[0].sequence).toEqual(["features", "faq"]);
    expect(report.clusters[0].pages.map((p: { name: string }) => p.name).sort())
      .toEqual(["投放页A", "投放页B"]);
    // 两张都没打散指纹——这是唯一可行动的那个数
    expect(report.clusters[0].unseeded).toBe(2);
    expect(report.unseeded).toBe(2);
  });

  test("打散过指纹的页仍在组里，但不计入未打散数", async ({ page }) => {
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.query(
      `INSERT INTO landing_pages (user_id, name, status, data, published_data, published_at)
       VALUES ($1,'已打散','published',$2::jsonb,$2::jsonb,NOW()),
              ($1,'未打散','published',$3::jsonb,$3::jsonb,NOW())`,
      [devUserId, draft(["features"], "seed-xyz"), draft(["features"])],
    );

    await devLogin(page);
    const report = await (await page.request.get("/api/antiban/similarity")).json();
    expect(report.clusters[0].pages).toHaveLength(2);
    expect(report.clusters[0].unseeded).toBe(1);
  });

  test("未登录拿不到读数", async ({ request }) => {
    expect((await request.get("/api/antiban/similarity")).status()).toBe(401);
  });
});
