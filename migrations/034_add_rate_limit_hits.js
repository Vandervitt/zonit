/** @type {import('node-pg-migrate').MigrationBuilder} */
// 跨实例限频：原限频器是进程内内存实现，serverless 下每个实例各算各的，
// 实例一多就接近失效。改为落库的滑动窗口，所有实例共享同一份计数。
//
// bucket 存的是 **加盐哈希后的 IP + 用途**，不存原始 IP（访客 PII 最小化）。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS rate_limit_hits (
      id     BIGSERIAL   PRIMARY KEY,
      bucket TEXT        NOT NULL,
      hit_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_rate_limit_hits_bucket_time ON rate_limit_hits (bucket, hit_at);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_rate_limit_hits_bucket_time;
    DROP TABLE IF EXISTS rate_limit_hits;
  `);
};
