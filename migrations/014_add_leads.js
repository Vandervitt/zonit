/** @type {import('node-pg-migrate').MigrationBuilder} */
// 线索表：表单兜底留资，存 PII（联系方式/留言），区别于无 PII 的 analytics_events。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS leads (
      id           BIGSERIAL   PRIMARY KEY,
      page_id      TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      payload      JSONB       NOT NULL,
      channel      TEXT,
      utm_source   TEXT,
      utm_medium   TEXT,
      utm_campaign TEXT,
      is_read      BOOLEAN     NOT NULL DEFAULT false,
      created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_leads_page_time   ON leads(page_id, created_at);
    CREATE INDEX IF NOT EXISTS idx_leads_page_unread ON leads(page_id, is_read);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_leads_page_unread;
    DROP INDEX IF EXISTS idx_leads_page_time;
    DROP TABLE IF EXISTS leads;
  `);
};
