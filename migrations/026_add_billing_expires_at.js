/** @type {import('node-pg-migrate').MigrationBuilder} */
// 周期末取消的到期时间：取消时写入（权益保留至此），重新激活或到期回落时清空。
// 展示层据此提示「订阅已取消，权益保留至 X」。
exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_expires_at TIMESTAMPTZ;`);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS billing_expires_at;`);
};
