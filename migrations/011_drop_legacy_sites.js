/** @type {import('node-pg-migrate').MigrationBuilder} */
// 移除旧落地页系统（sites 流程）的数据表。
// 先删 domains.site_id（其外键 REFERENCES sites），再删 sites 表本身。
// 新落地页流程使用 landing_pages 表与 domains.landing_page_id，不依赖 sites。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE domains DROP COLUMN IF EXISTS site_id;
    DROP INDEX IF EXISTS idx_sites_user_name;
    DROP INDEX IF EXISTS idx_sites_user_id;
    DROP TABLE IF EXISTS sites;
  `);
};

// 回滚：重建 sites 表结构与索引，并加回 domains.site_id 列（仅恢复结构，不恢复数据）。
exports.down = (pgm) => {
  pgm.sql(`
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
    ALTER TABLE domains ADD COLUMN IF NOT EXISTS site_id TEXT REFERENCES sites(id) ON DELETE SET NULL;
  `);
};
