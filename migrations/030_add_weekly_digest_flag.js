/** @type {import('node-pg-migrate').MigrationBuilder} */
// 周报摘要邮件开关：挂在线索通知设置表（按 user 一份，默认开启；无行视为开启）。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE lead_notification_settings
      ADD COLUMN IF NOT EXISTS weekly_digest_enabled BOOLEAN NOT NULL DEFAULT TRUE;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE lead_notification_settings DROP COLUMN IF EXISTS weekly_digest_enabled;
  `);
};
