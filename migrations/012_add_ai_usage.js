/** @type {import('node-pg-migrate').MigrationBuilder} */
// AI 用量计量：ai_usage 流水表（按月统计额度消耗）+ users.ai_credit_balance（持久 credits，永不过期）。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS ai_usage (
      id         BIGSERIAL   PRIMARY KEY,
      user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      kind       TEXT        NOT NULL CHECK (kind IN ('page','rewrite')),
      source     TEXT        NOT NULL CHECK (source IN ('quota','credit')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_ai_usage_user_kind_time ON ai_usage(user_id, kind, created_at);
    ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_credit_balance INT NOT NULL DEFAULT 0;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_ai_usage_user_kind_time;
    DROP TABLE IF EXISTS ai_usage;
    ALTER TABLE users DROP COLUMN IF EXISTS ai_credit_balance;
  `);
};
