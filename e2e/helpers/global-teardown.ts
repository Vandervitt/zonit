import { cleanupAllE2EFixtures, closeDb } from './db';

export default async function globalTeardown() {
  await cleanupAllE2EFixtures();
  await closeDb();
}
