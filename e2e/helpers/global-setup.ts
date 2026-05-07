import { ensureTestUser, cleanupAllE2EFixtures, closeDb } from './db';

export default async function globalSetup() {
  await ensureTestUser();
  await cleanupAllE2EFixtures();   // 干净起跑线
  await closeDb();
}
