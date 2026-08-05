import {
  ensureTestUser,
  ensureDevUserLocale,
  cleanupAllE2EFixtures,
  closeDb,
  isDbE2EEnabled,
} from './db';

export default async function globalSetup() {
  if (!isDbE2EEnabled) return;
  await ensureTestUser();
  // dev 登录账号也钉中文：多数 spec 走那条路径，且它的 locale 会被本机手动切换污染。
  await ensureDevUserLocale();
  await cleanupAllE2EFixtures();   // 干净起跑线
  await closeDb();
}
