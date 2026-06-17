/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS landing_pages (
      id           TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      user_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      name         TEXT        NOT NULL,
      slug         TEXT        UNIQUE,
      status       TEXT        NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published')),
      data         JSONB       NOT NULL,
      published_at TIMESTAMPTZ,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS idx_landing_pages_user_id ON landing_pages(user_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_landing_pages_user_name ON landing_pages(user_id, name);

    ALTER TABLE domains
      ADD COLUMN IF NOT EXISTS landing_page_id TEXT REFERENCES landing_pages(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_domains_landing_lookup
      ON domains(domain) WHERE enabled = true AND verified = true AND landing_page_id IS NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_domains_landing_lookup;
    ALTER TABLE domains DROP COLUMN IF EXISTS landing_page_id;
    DROP INDEX IF EXISTS idx_landing_pages_user_name;
    DROP INDEX IF EXISTS idx_landing_pages_user_id;
    DROP TABLE IF EXISTS landing_pages;
  `);
};
