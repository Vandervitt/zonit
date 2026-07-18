/** @type {import('node-pg-migrate').MigrationBuilder} */
// 租户线索通知设置（按 user 一份）+ webhook 出站投递队列（状态机，镜像 capi_events）。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS lead_notification_settings (
      user_id         TEXT        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
      email_enabled   BOOLEAN     NOT NULL DEFAULT TRUE,
      webhook_enabled BOOLEAN     NOT NULL DEFAULT FALSE,
      webhook_url     TEXT,
      webhook_secret  TEXT,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS webhook_deliveries (
      id         BIGSERIAL   PRIMARY KEY,
      user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      page_id    TEXT        REFERENCES landing_pages(id) ON DELETE SET NULL,
      payload    JSONB       NOT NULL,
      status     TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
      attempts   INT         NOT NULL DEFAULT 0,
      last_error TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at    TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status_time ON webhook_deliveries(status, created_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_webhook_deliveries_status_time;
    DROP TABLE IF EXISTS webhook_deliveries;
    DROP TABLE IF EXISTS lead_notification_settings;
  `);
};
