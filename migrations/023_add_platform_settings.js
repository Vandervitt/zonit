/** @type {import('node-pg-migrate').MigrationBuilder} */
// 平台设置 KV 表：运营者在 super-admin 端可随时更新的全局配置。
// 通用键值结构（key 主键 + value 文本），首个用途为「联系创始人」的微信号/二维码/邮箱。
// 无对应行时读取点回落空串，UI 自行决定是否展示。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS platform_settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL DEFAULT '',
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS platform_settings;`);
};
