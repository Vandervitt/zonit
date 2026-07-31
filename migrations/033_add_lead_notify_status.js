/** @type {import('node-pg-migrate').MigrationBuilder} */
// 线索通知送达可见性：把「这条线索的通知有没有发出去」记在线索上。
// 此前邮件发送结果被直接丢弃（只在失败时 console.error），客户无从判断
// 「没收到通知」是平台没发、还是自己邮箱收进了垃圾箱。
//
// webhook 侧不复制状态：只存投递行 id，状态从 webhook_deliveries 联查，
// 免得重试改了状态而线索这边的副本过期。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE leads
      ADD COLUMN IF NOT EXISTS notify_email TEXT,
      ADD COLUMN IF NOT EXISTS notify_email_error TEXT,
      ADD COLUMN IF NOT EXISTS notify_webhook_delivery_id BIGINT
        REFERENCES webhook_deliveries(id) ON DELETE SET NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE leads
      DROP COLUMN IF EXISTS notify_webhook_delivery_id,
      DROP COLUMN IF EXISTS notify_email_error,
      DROP COLUMN IF EXISTS notify_email;
  `);
};
