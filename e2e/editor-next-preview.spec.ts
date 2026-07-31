// e2e/editor-next-preview.spec.ts
// E2E：编辑器实时预览 happy-path。
// - 建页入口在落地页列表：/admin/landing-pages 点「新建」弹出模板选择对话框，卡片上的
//   「直接编辑」建页并跳 /admin/editor/[id]（另一颗「AI 一键成页」走 ?ai=1，不在本用例范围）。
//   故本用例走真实流程：Dev Login → 列表「新建」→ 搜到 Aurae Skincare → 「直接编辑」→
//   落到编辑器详情页 → 断言右栏预览 iframe，并验证改 Hero 标题即时反映到预览。
// - 顺带覆盖 POST /api/landing-pages 的按模板建页路径（loadTemplateDraft 取草稿）。
// - 用搜索框锁定 Aurae Skincare，避免依赖模板在画廊中的排序（模板库会持续扩充）。
//   其 Hero 主标题以 "Skincare that actually fits" 开头。
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

  test('模板选择器建页 → 编辑器实时预览 → 改 Hero 标题即时反映到预览 iframe', async ({ page }) => {
    // 1) Dev Login 建立会话
    await page.goto('/login');
    await page.getByRole('button', { name: /Dev Login/i }).click();
    await page.waitForURL('**/admin', { timeout: 30_000 });

    // 2) 落地页列表 →「新建」→ 模板选择器
    // 「新建」按钮在 hydration 完成前就已可点击，过早的点击会静默丢失（对话框不弹）。
    // 故用 toPass 重试「点击 + 断言对话框已开」，而不是靠固定 sleep 赌 hydration 时机。
    await page.goto('/admin/landing-pages');
    const dialog = page.getByRole('dialog');
    await expect(async () => {
      await page.getByRole('button', { name: '新建' }).click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });

    // 3) 搜到 Aurae Skincare 后点「直接编辑」建页 → 跳编辑器详情页
    // input[type=search] 的可访问角色是 searchbox（不是 textbox）
    await dialog.getByRole('searchbox', { name: '搜索模板名称' }).fill('Aurae Skincare');
    await dialog.getByRole('button', { name: '直接编辑' }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });

    // 4) 右栏预览 iframe 存在，预览初始呈现该模板 Hero 标题
    const frame = page.frameLocator('iframe[title="落地页实时预览"]');
    await expect(frame.getByRole('heading', { name: /Skincare that actually fits/i })).toBeVisible();

    // 5) 中栏 Hero 主标题输入框：填入新标题
    const titleInput = page.getByLabel('主标题');
    await titleInput.fill('Brand new hero headline');

    // 6) 预览 iframe 实时更新为新标题，旧标题消失
    await expect(frame.getByRole('heading', { name: 'Brand new hero headline' })).toBeVisible();
    await expect(frame.getByRole('heading', { name: /Skincare that actually fits/i })).toHaveCount(0);
  });
});
