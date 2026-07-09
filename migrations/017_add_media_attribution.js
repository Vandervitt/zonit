/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE media
      ADD COLUMN IF NOT EXISTS source      TEXT NOT NULL DEFAULT 'upload',
      ADD COLUMN IF NOT EXISTS credit_name TEXT,
      ADD COLUMN IF NOT EXISTS credit_url  TEXT;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE media
      DROP COLUMN IF EXISTS source,
      DROP COLUMN IF EXISTS credit_name,
      DROP COLUMN IF EXISTS credit_url;
  `);
};
