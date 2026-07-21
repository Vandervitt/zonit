/** @type {import('node-pg-migrate').MigrationBuilder} */
// 计费 provider 抽象所需的用户列。provider-generic 命名（billing_*），
// 支持 Dodo / Creem 共用同一组列；旧 ls_* 列保留以便回滚，不在此删除。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_provider TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_customer_id TEXT;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_subscription_id TEXT;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS billing_subscription_id;
    ALTER TABLE users DROP COLUMN IF EXISTS billing_customer_id;
    ALTER TABLE users DROP COLUMN IF EXISTS billing_provider;
  `);
};
