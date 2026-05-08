import { cleanupAllE2EFixtures, closeDb, isDbE2EEnabled } from './db';

export default async function globalTeardown() {
  if (!isDbE2EEnabled) return;
  await cleanupAllE2EFixtures();
  await closeDb();
}
