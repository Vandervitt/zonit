// e2e/seo.spec.ts
// SEO：已发布页带自定义 seo（metaTitle/metaDescription/noindex）→ 自有域公开页 head 反映 + robots.txt disallow。
// 复用 landing-pages-flow.spec.ts 的自有域 fixture 模式：pg 注入 landing_pages + domains，Host 头触发 handleTenancy。
import { test, expect, request as playwrightRequest } from "@playwright/test";
import { Pool } from "pg";
import { config as loadEnv } from "dotenv";
import { E2E_USER_ID, SLUG_PREFIX, isDbE2EEnabled } from "./helpers/db";
import { skincareConsultDraft } from "@/landing-editor/samples/skincareConsultDraft";

loadEnv({ path: ".env.local" });
loadEnv({ path: ".env" });

const SLUG = `${SLUG_PREFIX}seo`;
const CUSTOM_DOMAIN = "e2e-seo.test";
const META_TITLE = "SEO自定义标题E2E";
const META_DESC = "SEO自定义描述E2E";

let pool: Pool;
let landingPageId: string;

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? "";
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

// 在样例草稿上覆盖 seo（自定义标题/描述 + noindex）。
const draftWithSeo = {
  ...skincareConsultDraft,
  seo: { metaTitle: META_TITLE, metaDescription: META_DESC, noindex: true },
};

test.describe("SEO 元数据（自有域）", () => {
  test.skip(!isDbE2EEnabled, "Set RUN_DB_E2E=1 to run database-backed e2e tests.");

  test.beforeAll(async () => {
    pool = makePool();
    await pool.query(`DELETE FROM domains WHERE domain = $1`, [CUSTOM_DOMAIN]);
    await pool.query(`DELETE FROM landing_pages WHERE slug = $1`, [SLUG]);
    const lp = await pool.query(
      `INSERT INTO landing_pages (user_id, name, slug, status, data, published_at)
       VALUES ($1, $2, $3, 'published', $4::jsonb, NOW()) RETURNING id`,
      [E2E_USER_ID, SLUG, SLUG, JSON.stringify(draftWithSeo)],
    );
    landingPageId = lp.rows[0].id;
    await pool.query(
      `INSERT INTO domains (user_id, domain, enabled, verified, landing_page_id)
       VALUES ($1, $2, true, true, $3)`,
      [E2E_USER_ID, CUSTOM_DOMAIN, landingPageId],
    );
  });

  test.afterAll(async () => {
    if (pool) {
      await pool.query(`DELETE FROM domains WHERE domain = $1`, [CUSTOM_DOMAIN]);
      await pool.query(`DELETE FROM landing_pages WHERE slug = $1`, [SLUG]);
      await pool.end();
    }
  });

  test("公开页 head 用自定义 SEO + noindex", async () => {
    const ctx = await playwrightRequest.newContext();
    try {
      const res = await ctx.get("http://localhost:3001/", { headers: { Host: CUSTOM_DOMAIN } });
      expect(res.status()).toBe(200);
      const html = await res.text();
      expect(html).toContain(META_TITLE);
      expect(html).toContain(META_DESC);
      expect(html.toLowerCase()).toContain("noindex");
    } finally {
      await ctx.dispose();
    }
  });

  test("robots.txt 对 noindex 页 disallow", async () => {
    const ctx = await playwrightRequest.newContext();
    try {
      const res = await ctx.get("http://localhost:3001/robots.txt", { headers: { Host: CUSTOM_DOMAIN } });
      const body = await res.text();
      expect(body).toMatch(/Disallow:\s*\//);
    } finally {
      await ctx.dispose();
    }
  });
});
