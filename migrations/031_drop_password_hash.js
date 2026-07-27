/** @type {import('node-pg-migrate').MigrationBuilder} */
// 丢弃 users.password_hash：邮箱/密码登录已下线（credentials provider 与
// /api/register 均已移除），该列自此无任何读写方，仅残留老用户的 bcrypt 哈希。
// 老用户改用同一邮箱走验证码登录即可，账号与权益由 provisionUserByEmail 按
// 邮箱 find-or-create 完整保留，不依赖此列。
//
// ⚠️ 不可逆：down 只能恢复列结构，**无法恢复已删除的哈希数据**。
// 回滚后所有 password_hash 均为 NULL；由于密码登录已无代码路径，这不影响任何功能。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE users DROP COLUMN IF EXISTS password_hash;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
  `);
};
