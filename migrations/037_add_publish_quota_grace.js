// 降档宽限：记录「已发布页数超出生效套餐额度」的起算时间。
//
// 不存在可埋点的降档时刻（effectivePlan 是读时计算的 max(plan, comp_plan)，
// comp_plan 过期纯时间驱动），故该列由每日对账写入与清除，而非降档事件触发。
// NULL = 当前未超额。
/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users
      ADD COLUMN IF NOT EXISTS publish_over_quota_since TIMESTAMPTZ;

    -- 对账只关心处于宽限中的用户，做部分索引避免全表扫。
    CREATE INDEX IF NOT EXISTS idx_users_publish_over_quota
      ON users(publish_over_quota_since) WHERE publish_over_quota_since IS NOT NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_users_publish_over_quota;
    ALTER TABLE users DROP COLUMN IF EXISTS publish_over_quota_since;
  `);
};
