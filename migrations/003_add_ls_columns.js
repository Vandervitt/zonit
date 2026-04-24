/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_customer_id TEXT UNIQUE;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ls_subscription_id TEXT UNIQUE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS ls_subscription_id;
    ALTER TABLE users DROP COLUMN IF EXISTS ls_customer_id;
  `);
};
