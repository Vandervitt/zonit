// e2e/footer-compliance.spec.ts
// E2E：页脚合规链路（政策子页可达 + 账号级经营主体选用）。
//
// 覆盖的是四平台通投清单里最容易翻车的一段：页脚必须给出**能点开**的隐私政策与
// 条款，以及（TikTok 电商/金融类要求的）经营主体信息。单测锁的是渲染与解析，
// 这里锁的是客户真正会走的那串点击：建页 → 页脚面板选主体 → 预览里链接点得开。
//
// 租户域上的 /privacy、/terms 由中间件解析（lib/proxy/tenant-proxy.test.ts 已覆盖 44 例），
// 浏览器里无法伪造 Host 头，故此处走编辑器预览侧的同构路由。
//
// 与既有 e2e 一致：默认 skip，置 RUN_DB_E2E=1 显式开启。

import { test, expect } from '@playwright/test';
import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

const RUN = process.env.RUN_DB_E2E === '1';
const DEV_EMAIL = process.env.DEV_USER_EMAIL ?? 'dev@localhost';
const PROFILE_LABEL = 'E2E 主体';
const LEGAL_NAME = 'E2E Compliance Ltd';

function makePool(): Pool {
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL ?? '';
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  return new Pool({ connectionString, ssl: isLocal ? false : { rejectUnauthorized: false } });
}

let pool: Pool;
let devUserId: string;

async function cleanup(): Promise<void> {
  if (!devUserId) return;
  await pool.query(`DELETE FROM landing_pages WHERE user_id = $1`, [devUserId]);
  await pool.query(`DELETE FROM company_profiles WHERE user_id = $1`, [devUserId]);
}

test.describe('页脚合规链路', () => {
  test.skip(!RUN, 'Set RUN_DB_E2E=1 to run database-backed e2e tests.');

  test.beforeAll(async () => {
    pool = makePool();
    const res = await pool.query(
      `INSERT INTO users (email, name, plan)
       VALUES ($1, 'Dev User', 'pro')
       ON CONFLICT (email) DO UPDATE SET plan = 'pro'
       RETURNING id`,
      [DEV_EMAIL],
    );
    devUserId = res.rows[0].id;
    await cleanup();
  });

  test.afterAll(async () => {
    await cleanup();
    await pool.end();
  });

  test('设置里建经营主体 → 页脚面板选用 → 预览页脚出链接与主体信息 → 政策子页打得开', async ({ page }) => {
    // 1) Dev Login
    await page.goto('/login');
    await page.getByRole('button', { name: /Dev Login/i }).click();
    await page.waitForURL('**/admin', { timeout: 30_000 });

    // 2) 设置页新建账号级经营主体
    await page.goto('/admin/settings');
    await expect(async () => {
      await page.getByRole('button', { name: '新增主体' }).click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    const modal = page.getByRole('dialog');
    await modal.getByRole('textbox', { name: '内部名称' }).fill(PROFILE_LABEL);
    await modal.getByRole('textbox', { name: '法律实体名' }).fill(LEGAL_NAME);
    await modal.getByRole('textbox', { name: '公司注册号' }).fill('99887766');
    await modal.getByRole('button', { name: '保 存' }).click();
    // 列表里出现成文后的那一行（与页脚展示同一份 formatCompanyInfo 结果）
    await expect(page.getByText(`${LEGAL_NAME} · Company No. 99887766`)).toBeVisible();

    // 3) 建页（模板选择器 → 直接编辑）
    await page.goto('/admin/landing-pages');
    const dialog = page.getByRole('dialog');
    await expect(async () => {
      await page.getByRole('button', { name: '新建' }).click();
      await expect(dialog).toBeVisible({ timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
    await dialog.getByRole('searchbox', { name: '搜索模板名称' }).fill('Aurae Skincare');
    await dialog.getByRole('button', { name: '直接编辑' }).first().click();
    await page.waitForURL(/\/admin\/editor\/[^/]+$/, { timeout: 30_000 });
    const editorUrl = page.url();

    // 4) 页脚面板选用该主体
    await page.getByRole('button', { name: /页脚/ }).click();
    await page.getByLabel(/经营主体信息/).selectOption({ label: PROFILE_LABEL });

    // 5) 右栏预览：政策链接与主体信息都在页脚
    const frame = page.frameLocator('iframe[title="落地页实时预览"]');
    await expect(frame.getByRole('link', { name: 'Privacy Policy' }).first()).toBeVisible();
    await expect(frame.getByRole('link', { name: 'Terms of Service' })).toBeVisible();
    await expect(frame.getByText(`${LEGAL_NAME} · Company No. 99887766`)).toBeVisible();

    // 6) 政策子页真能打开（点开 404 的链接比没有链接更糟）
    // 先等自动保存落库：政策子页是服务端渲染草稿，抢在防抖窗口内跳过去会读到旧草稿。
    await expect(page.getByText('已保存')).toBeVisible({ timeout: 15_000 });
    for (const [path, heading] of [
      ['privacy', 'Privacy Policy'],
      ['terms', 'Terms of Service'],
    ] as const) {
      const resp = await page.goto(`${editorUrl}/preview/${path}`);
      expect(resp?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
      await expect(page.getByText(`${LEGAL_NAME} · Company No. 99887766`)).toBeVisible();
    }
  });
});
