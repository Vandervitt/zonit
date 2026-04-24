/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free'
      CHECK (plan IN ('free', 'starter', 'pro', 'agency'));

    ALTER TABLE sites ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE sites DROP COLUMN IF EXISTS custom_domain;
    ALTER TABLE users DROP COLUMN IF EXISTS plan;
  `);
};
