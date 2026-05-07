// E2E DB 助手：直接通过 pg 注入"已发布"站点 fixture，避开登录态。
// 所有 fixture user_id 走固定 E2E_USER_ID；slug 必须以 e2e- 前缀，便于清理。

import { Pool } from 'pg';
import { config as loadEnv } from 'dotenv';
import type { LandingPageTemplate } from '@/types/schema';

loadEnv({ path: '.env.local' });
loadEnv({ path: '.env' });

export const E2E_USER_ID = '00000000-0000-0000-0000-00000000e2e0';
export const E2E_USER_EMAIL = 'e2e-fixture@zonit.test';
export const SLUG_PREFIX = 'e2e-';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

export async function ensureTestUser(): Promise<void> {
  await pool.query(
    `INSERT INTO users (id, email, plan)
     VALUES ($1, $2, 'pro')
     ON CONFLICT (id) DO NOTHING`,
    [E2E_USER_ID, E2E_USER_EMAIL],
  );
}

export async function seedPublishedSite(slug: string, template: LandingPageTemplate): Promise<void> {
  if (!slug.startsWith(SLUG_PREFIX)) {
    throw new Error(`E2E slug must start with "${SLUG_PREFIX}"`);
  }
  await pool.query(
    `INSERT INTO sites (user_id, name, template_id, slug, status, data, published_at)
     VALUES ($1, $2, $3, $4, 'published', $5::jsonb, NOW())
     ON CONFLICT (slug) DO UPDATE SET data = EXCLUDED.data, status = 'published', published_at = NOW()`,
    [E2E_USER_ID, slug, template.templateId, slug, JSON.stringify(template)],
  );
}

export async function cleanupSite(slug: string): Promise<void> {
  await pool.query(`DELETE FROM sites WHERE slug = $1`, [slug]);
}

export async function cleanupAllE2EFixtures(): Promise<void> {
  await pool.query(`DELETE FROM sites WHERE slug LIKE $1`, [`${SLUG_PREFIX}%`]);
}

export async function closeDb(): Promise<void> {
  await pool.end();
}
