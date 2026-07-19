/** @type {import('node-pg-migrate').MigrationBuilder} */
// comp_plan：超管赠送套餐，仅超管接口写入，LS webhook / billing 永不触碰；
// 生效套餐 = max(plan, comp_plan)，读取点见 lib/plans-db.ts / auth.ts。
// disabled_at：非空即禁用（禁登录 + 已发布页公网 404）。
// created_at：users 表此前无注册时间列（invited_at 可空），补列供看板趋势；
// 存量行回填为迁移时刻，趋势图对存量用户不精确，可接受。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS comp_plan TEXT NULL
      CHECK (comp_plan IN ('starter', 'pro', 'agency'));
    ALTER TABLE users ADD COLUMN IF NOT EXISTS disabled_at TIMESTAMPTZ NULL;
    ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS comp_plan;
    ALTER TABLE users DROP COLUMN IF EXISTS disabled_at;
    ALTER TABLE users DROP COLUMN IF EXISTS created_at;
  `);
};
