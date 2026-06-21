// e2e/editor-next-preview.spec.ts
// E2E：编辑器实时预览 happy-path。
// - 路由分层 + 模板画廊化后，/admin/editor 是模板选择页，真正的编辑器在 /admin/editor/[id]。
//   故本用例走真实流程：Dev Login → 画廊点首张模板「空白开始」建页 → 落到编辑器详情页 →
//   断言右栏预览 iframe，并验证改 Hero 标题即时反映到预览。
// - 顺带覆盖 POST /api/landing-pages 的按模板建页路径（loadTemplateDraft 取草稿）。
// - 首张模板为 Aurae Skincare（TEMPLATES[0]），其 Hero 主标题以 "Skincare that actually fits" 开头。
// - 与既有 e2e 一致：默认 skip，置 RUN_DB_E2E=1 显式开启；beforeAll/afterAll 用 pg 备好/清理 dev 用户落地页。

import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const RUN = process.env.RUN_DB_E2E === '1';
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? 'dev@localhost';

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;

test.describe('editor 实时预览', () => {
  test.skip(!RUN, 'Set RUN_DB_E2E=1 to run database-backed e2e tests.');

  test.beforeAll(async () => {
    pool = makePool();
    // 确保 dev 用户存在且有建页额度（pro），清空其历史落地页，保证可重复运行。
    const res = await pool.query(
      `INSERT INTO users (email, name, plan)
       VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan = 'pro'
       RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) {
      await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    }
    await pool.end();
  });

  test('画廊建页 → 编辑器实时预览 → 改 Hero 标题即时反映到预览 iframe', async ({ page }) => {
    // 1) Dev Login 建立会话
    await page.goto('/login');
    await page.getByRole('button', { name: /Dev Login/i }).click();
    await page.waitForURL('**/admin', { timeout: 30_000 });

    // 2) 进入模板画廊，点首张模板（Aurae Skincare）的「空白开始」建页 → 跳编辑器详情页
    await page.goto('/admin/editor');
    await page.getByRole('button', { name: '空白开始' }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    // 3) 右栏预览 iframe 存在，预览初始呈现该模板 Hero 标题
    const frame = page.frameLocator('iframe[title="落地页实时预览"]');
    await expect(frame.getByRole('heading', { name: /Skincare that actually fits/i })).toBeVisible();

    // 4) 中栏 Hero 主标题输入框：填入新标题
    const titleInput = page.getByLabel('主标题');
    await titleInput.fill('Brand new hero headline');

    // 5) 预览 iframe 实时更新为新标题，旧标题消失
    await expect(frame.getByRole('heading', { name: 'Brand new hero headline' })).toBeVisible();
    await expect(frame.getByRole('heading', { name: /Skincare that actually fits/i })).toHaveCount(0);
  });
});
