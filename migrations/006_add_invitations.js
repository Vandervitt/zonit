
/**
 * Migration: Add Invitations table and Trial support
 */
export async function up(pool) {
  // 1. Create Invitations table
  await pool.query(`
    CREATE TABLE IF NOT EXISTS invitations (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      email TEXT NOT NULL,
      token TEXT UNIQUE NOT NULL,
      plan TEXT NOT NULL DEFAULT 'pro',
      duration_days INTEGER NOT NULL DEFAULT 15,
      invited_by TEXT NOT NULL REFERENCES users(id),
      accepted_at TIMESTAMPTZ,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_invitations_token ON invitations(token);
    CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
  `);

  // 2. Add trial fields to users table
  await pool.query(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS trial_expires_at TIMESTAMPTZ;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS invited_at TIMESTAMPTZ;
  `);
}

export async function down(pool) {
  await pool.query(`DROP TABLE IF EXISTS invitations;`);
  await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS trial_expires_at;`);
  await pool.query(`ALTER TABLE users DROP COLUMN IF EXISTS invited_at;`);
}
