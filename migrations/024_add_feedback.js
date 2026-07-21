/** @type {import('node-pg-migrate').MigrationBuilder} */
// 用户反馈表：埋在「情绪高点」（取消发布/删除等）收集的一句话反馈。
// user_id 存快照式外键（删号置空但保留反馈）；email 冗余留存，便于事后联系。
// source 标记触发点：unpublish | delete | publish_success | error | general。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS feedback (
      id         BIGSERIAL   PRIMARY KEY,
      user_id    TEXT        REFERENCES users(id) ON DELETE SET NULL,
      email      TEXT,
      source     TEXT        NOT NULL,
      message    TEXT        NOT NULL,
      context    JSONB       NOT NULL DEFAULT '{}'::jsonb,
      is_read    BOOLEAN     NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_feedback_time   ON feedback(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_feedback_unread ON feedback(is_read);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_feedback_unread;
    DROP INDEX IF EXISTS idx_feedback_time;
    DROP TABLE IF EXISTS feedback;
  `);
};
