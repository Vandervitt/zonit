/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS preset_templates (
      id           TEXT        PRIMARY KEY,
      name         TEXT        NOT NULL,
      description  TEXT        NOT NULL,
      category     TEXT        NOT NULL,
      accent_color TEXT        NOT NULL,
      gradient     TEXT        NOT NULL,
      data         JSONB       NOT NULL,
      created_by   TEXT        REFERENCES users(id) ON DELETE SET NULL,
      sort_order   INTEGER     NOT NULL DEFAULT 0,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_preset_templates_sort ON preset_templates(sort_order);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS preset_templates;`);
};
