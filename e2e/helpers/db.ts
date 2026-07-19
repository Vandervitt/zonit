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
    `INSERT INTO users (id, email, plan)
     VALUES ($1, $2, 'pro')
     ON CONFLICT (id) DO NOTHING`,
    [E2E_USER_ID, E2E_USER_EMAIL],
  );
}

export async function cleanupAllE2EFixtures(): Promise<void> {
  await getPool().query(`DELETE FROM domains WHERE domain LIKE $1`, [`${SLUG_PREFIX}%`]);
  await getPool().query(`DELETE FROM landing_pages WHERE slug LIKE $1`, [`${SLUG_PREFIX}%`]);
}

export async function closeDb(): Promise<void> {
  await pool?.end();
  pool = null;
}
