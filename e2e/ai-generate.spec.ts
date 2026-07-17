// E2E：AI 一键成页 happy-path。
// - 通过登录页的「⚡ Dev Login」（dev@localhost，仅 NODE_ENV=development 生效）建立会话，
//   避免凭证流脆弱性。
// - webServer 由 playwright.config 注入 AI_FAKE=1，/api/landing-pages/generate 走确定性 fake，
//   无需真实 OPENAI_API_KEY。
// - 生成是有状态的（落地页数量上限 + ai_usage 月额度），故 beforeAll/afterAll 直接用 pg
//   重置 dev 用户的 landing_pages 与 ai_usage，并把其 plan 设为 pro 以留足额度。
// - 与既有 e2e 一致：默认 skip，置 RUN_DB_E2E=1 显式开启。

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

test.describe('AI 一键成页', () => {
  test.skip(!RUN, 'Set RUN_DB_E2E=1 to run database-backed e2e tests.');

  test.beforeAll(async () => {
    pool = makePool();
    // 确保 dev 用户存在并有足够额度（pro），并清空其历史落地页与 AI 用量，保证可重复运行。
    const res = await pool.query(
      `INSERT INTO users (email, name, plan)
       VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan = 'pro'
       RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
    await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
    await pool.query(`DELETE FROM ai_usage WHERE user_id = $1`, [devUserId]);
  });

  test.afterAll(async () => {
    if (devUserId) {
      await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
      await pool.query(`DELETE FROM ai_usage WHERE user_id = $1`, [devUserId]);
    }
    await pool.end();
  });

  test('模板弹窗「AI 一键成页」→ 进编辑器 → 表单默认弹出 → 生成后原地填充', async ({ page }) => {
    // 1) Dev Login 建立会话
    await page.goto('/login');
    await page.getByRole('button', { name: /Dev Login/i }).click();
    await page.waitForURL('**/admin', { timeout: 30_000 });

    // 2) 概览页打开模板选择弹窗，点某张模板的「AI 一键成页」
    await page.getByRole('button', { name: /新建落地页/ }).click();
    await page.getByRole('button', { name: 'AI 一键成页' }).first().click();

    // 3) 先建库并进入编辑器，URL 带 ?ai=1
    await page.waitForURL(/\/admin\/editor\/[^/?]+\?ai=1$/, { timeout: 30_000 });

    // 4) 编辑器内资料表单默认弹出：填写并提交
    await page.getByLabel('产品 / 公司名').fill('Acme 出海咨询');
    await page.getByLabel('它做什么 / 解决什么').fill('为出海企业提供本地化获客与合规咨询');
    await page.getByRole('button', { name: '一键成页' }).click();

    // 5) 生成成功：表单关闭、URL 去掉 ?ai，仍停在同一张落地页编辑器
    await page.waitForURL(/\/admin\/editor\/[^/?]+$/, { timeout: 30_000 });
    await expect(page.getByRole('button', { name: '一键成页' })).toHaveCount(0);
    await expect(page).toHaveURL(/\/admin\/editor\/[^/?]+$/);
  });
});
