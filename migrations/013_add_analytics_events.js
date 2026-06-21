/** @type {import('node-pg-migrate').MigrationBuilder} */
// 投放分析事件流水：first-party 匿名采集（page_view / cta_click），无 PII。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS analytics_events (
      id           BIGSERIAL   PRIMARY KEY,
      page_id      TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      event        TEXT        NOT NULL CHECK (event IN ('page_view','cta_click')),
      channel      TEXT,
      utm_source   TEXT,
      utm_medium   TEXT,
      utm_campaign TEXT,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_analytics_page_time ON analytics_events(page_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_analytics_page_event ON analytics_events(page_id, event);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_analytics_page_event;
    DROP INDEX IF EXISTS idx_analytics_page_time;
    DROP TABLE IF EXISTS analytics_events;
  `);
};
