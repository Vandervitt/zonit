/** @type {import('node-pg-migrate').MigrationBuilder} */
// CAPI 待回传事件队列（状态机）。payload 中 email/phone 为 SHA-256 哈希，不存明文。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS capi_events (
      id          BIGSERIAL   PRIMARY KEY,
      page_id     TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      provider    TEXT        NOT NULL,
      event_name  TEXT        NOT NULL,
      event_id    TEXT        NOT NULL,
      payload     JSONB       NOT NULL,
      status      TEXT        NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sent','failed')),
      attempts    INT         NOT NULL DEFAULT 0,
      last_error  TEXT,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      sent_at     TIMESTAMPTZ
    );
    CREATE INDEX IF NOT EXISTS idx_capi_events_status_time ON capi_events(status, created_at);
  `);
};
exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_capi_events_status_time;
    DROP TABLE IF EXISTS capi_events;
  `);
};
