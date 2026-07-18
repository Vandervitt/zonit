/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE landing_pages
      ADD COLUMN IF NOT EXISTS preview_secret TEXT;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE landing_pages
      DROP COLUMN IF EXISTS preview_secret;
  `);
};
