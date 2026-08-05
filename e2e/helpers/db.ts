// E2E DB 助手：直接通过 pg 注入"已发布"站点 fixture，避开登录态。
// 所有 fixture user_id 走固定 E2E_USER_ID；slug 必须以 e2e- 前缀，便于清理。

import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

export const isDbE2EEnabled = process.env.RUN_DB_E2E === '1';
export const E2E_USER_ID = '00000000-0000-0000-0000-00000000e2e0';
export const E2E_USER_EMAIL = 'e2e-fixture@zapbridge.test';
export const SLUG_PREFIX = 'e2e-';

/**
 * E2E 固定跑中文。
 *
 * 用例断言认的是中文文案，故语言必须由测试自己钉死，不能依赖 users.locale
 * 的当前值或 defaultLocale（那是英文）——否则本机手动切过语言就会让整套变红。
 * 英文面的覆盖由 e2e/admin-i18n.spec.ts 单独负责。
 */
export const E2E_LOCALE = 'zh';

let pool: Pool | null = null;

function getPool(): Pool {
  if (!isDbE2EEnabled) {
    throw new Error('DB E2E is disabled. Set RUN_DB_E2E=1 to run database-backed Playwright tests.');
  }
  const connectionString = process.env.E2E_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('Missing E2E_DATABASE_URL or DATABASE_URL for database-backed Playwright tests.');
  }
  // 对齐 lib/db.ts：本地 docker Postgres 不支持 SSL，远端（如 Neon）需要。
  const isLocal = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  pool ??= new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
  });
  return pool;
}

export async function ensureTestUser(): Promise<void> {
  await getPool().query(
    `INSERT INTO users (id, email, plan, locale)
     VALUES ($1, $2, 'pro', $3)
     ON CONFLICT (id) DO UPDATE SET locale = EXCLUDED.locale`,
    [E2E_USER_ID, E2E_USER_EMAIL, E2E_LOCALE],
  );
}

/**
 * dev 一键登录用的账号也要钉语言。
 *
 * 它由 auth.ts 的 dev provider 用 upsert 建，不经过 ensureTestUser——
 * 多数 spec 走的是这条登录路径，漏掉它的话用例语言就跟着 users.locale
 * 的历史值漂（本机上次手动切成 en，下次跑 E2E 就全红）。
 */
export async function ensureDevUserLocale(): Promise<void> {
  const email = process.env.DEV_USER_EMAIL;
  if (!email) return;
  await getPool().query(`UPDATE users SET locale = $1 WHERE email = $2`, [E2E_LOCALE, email]);
}

export async function cleanupAllE2EFixtures(): Promise<void> {
  await getPool().query(`DELETE FROM domains WHERE domain LIKE $1`, [`${SLUG_PREFIX}%`]);
  await getPool().query(`DELETE FROM landing_pages WHERE slug LIKE $1`, [`${SLUG_PREFIX}%`]);
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = null;
}
