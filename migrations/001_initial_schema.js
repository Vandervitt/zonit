/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      name TEXT,
      email TEXT UNIQUE,
      email_verified TIMESTAMPTZ,
      image TEXT,
      password_hash TEXT
    );

    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      provider TEXT NOT NULL,
      provider_account_id TEXT NOT NULL,
      refresh_token TEXT,
      access_token TEXT,
      expires_at BIGINT,
      token_type TEXT,
      scope TEXT,
      id_token TEXT,
      session_state TEXT,
      UNIQUE(provider, provider_account_id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      session_token TEXT UNIQUE NOT NULL,
      expires TIMESTAMPTZ NOT NULL
    );

    CREATE TABLE IF NOT EXISTS verification_tokens (
      identifier TEXT NOT NULL,
      token TEXT NOT NULL,
      expires TIMESTAMPTZ NOT NULL,
      UNIQUE(identifier, token)
    );

    CREATE TABLE IF NOT EXISTS sites (
      id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT        NOT NULL,
      template_id  TEXT        NOT NULL,
      slug         TEXT        UNIQUE,
      status       TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
      data         JSONB       NOT NULL,
      published_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_sites_user_id ON sites(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sites_user_name ON sites(user_id, name);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_sites_user_name;
    DROP INDEX IF EXISTS idx_sites_user_id;
    DROP TABLE IF EXISTS sites;
    DROP TABLE IF EXISTS verification_tokens;
    DROP TABLE IF EXISTS sessions;
    DROP TABLE IF EXISTS accounts;
    DROP TABLE IF EXISTS users;
  `);
};
