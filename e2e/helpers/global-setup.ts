import { ensureTestUser, cleanupAllE2EFixtures, closeDb, isDbE2EEnabled } from './db';

export default async function globalSetup() {
  if (!isDbE2EEnabled) return;
  await ensureTestUser();
  await cleanupAllE2EFixtures();   // 干净起跑线
  await closeDb();
}
