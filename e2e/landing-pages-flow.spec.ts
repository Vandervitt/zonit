// E2E capstone（Task 14）：落地页多租户「发布渲染」与「取消发布 → 404」。
//
// 与既有 e2e 一致：绕开登录态/编辑器，直接通过 pg 注入 fixture，再走公开渲染路径校验。
// 这里走「新流程」表：landing_pages + domains.landing_page_id。
// 通过给根路径 / 带自定义 Host 头，触发 handleTenancy 重写到 /p/<slug> 渲染。
//
// SSL 说明：本地 docker Postgres 不支持 SSL，远端（如 Neon）需要。
// 因此连接策略对齐 lib/db.ts —— 本地关闭 SSL，其余 rejectUnauthorized:false。

import { test, expect, request as playwrightRequest } from '@playwright/test';
import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';
import {
  E2E_USER_ID,
  E2E_USER_EMAIL,
  SLUG_PREFIX,
  isDbE2EEnabled,
} from './helpers/db';
import { skincareConsultDraft } from '@/landing-editor/samples/skincareConsultDraft';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const SLUG = `${SLUG_PREFIX}skincare`;
const CUSTOM_DOMAIN = 'e2e-acme.test';
const HERO_TITLE = 'Skincare that actually fits your skin';

let pool: Pool;
let landingPageId: string;

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  return new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
}

test.describe('落地页多租户：发布渲染与取消发布', () => {
  test.skip(!isDbE2EEnabled, 'Set RUN_DB_E2E=1 to run database-backed e2e tests.');

  test.beforeAll(async () => {
    pool = makePool();

    // 1) 确保拥有页面的测试用户存在（globalSetup 已建，这里幂等兜底）。
    await pool.query(
      `INSERT INTO users (id, email, plan) VALUES ($1, $2, 'pro')
       ON CONFLICT (id) DO NOTHING`,
      [E2E_USER_ID, E2E_USER_EMAIL],
    );

    // 起跑线：清掉可能残留的同名 fixture。
    await pool.query(`DELETE FROM domains WHERE domain = $1`, [CUSTOM_DOMAIN]);
    await pool.query(`DELETE FROM landing_pages WHERE slug = $1`, [SLUG]);

    // 2) 注入一条已发布落地页（data 用完整有效的 skincareConsultDraft）。
    const lp = await pool.query(
      `INSERT INTO landing_pages (user_id, name, slug, status, data, published_at)
       VALUES ($1, $2, $3, 'published', $4::jsonb, NOW())
       RETURNING id`,
      [E2E_USER_ID, SLUG, SLUG, JSON.stringify(skincareConsultDraft)],
    );
    landingPageId = lp.rows[0].id;

    // 3) 绑定一条已启用、已验证的自定义域名到该落地页。
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

  test('自定义域名根路径渲染已发布落地页；取消发布后返回 404', async () => {
    // APIRequestContext 可可靠设置自定义 Host 头，触发 handleTenancy 重写。
    const ctx = await playwrightRequest.newContext();
    try {
      // —— 发布态：Host=自定义域名 → 重写到 /p/<slug> 并渲染 hero 标题 ——
      const published = await ctx.get('http://localhost:3001/', {
        headers: { Host: CUSTOM_DOMAIN },
      });
      expect(published.status()).toBe(200);
      expect(await published.text()).toContain(HERO_TITLE);

      // —— 取消发布：同一域名请求应返回 404 ——
      await pool.query(`UPDATE landing_pages SET status = 'draft' WHERE id = $1`, [landingPageId]);

      const afterUnpublish = await ctx.get('http://localhost:3001/', {
        headers: { Host: CUSTOM_DOMAIN },
      });
      expect(afterUnpublish.status()).toBe(404);
    } finally {
      await ctx.dispose();
    }
  });
});
