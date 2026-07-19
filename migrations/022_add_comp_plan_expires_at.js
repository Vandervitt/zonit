/** @type {import('node-pg-migrate').MigrationBuilder} */
// 赠送套餐有效期：comp_plan_expires_at 到该时刻后赠送失效（生效套餐回落付费档）。
// NULL = 永久（存量赠送保持永久有效，不追溯过期）。过期在读取点判定，不物理清除。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS comp_plan_expires_at TIMESTAMPTZ NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS comp_plan_expires_at;
  `);
};
