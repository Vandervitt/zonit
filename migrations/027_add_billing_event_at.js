/** @type {import('node-pg-migrate').MigrationBuilder} */
// webhook 时序守卫：记录最近一次已应用的订阅事件发生时间。
// 渠道 webhook 不保证到达顺序（实测两次快速换档出现旧事件后到覆盖新状态），
// 落库前比对该时间，旧事件直接丢弃。
exports.up = (pgm) => {
  pgm.sql(`ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_event_at TIMESTAMPTZ;`);
};

exports.down = (pgm) => {
  pgm.sql(`ALTER TABLE users DROP COLUMN IF EXISTS billing_event_at;`);
};
