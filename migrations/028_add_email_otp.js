/** @type {import('node-pg-migrate').MigrationBuilder} */
// 邮箱验证码（OTP）表：支撑免密登录/注册。
// code_hash 存 bcrypt 哈希不落明文；单邮箱同一时刻仅一条未消费码（业务层保证）；
// attempts 累计校验失败次数用于防爆破；consumed_at 标记一次性使用。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS email_otps (
      id          TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      email       TEXT        NOT NULL,
      code_hash   TEXT        NOT NULL,
      expires_at  TIMESTAMPTZ NOT NULL,
      consumed_at TIMESTAMPTZ,
      attempts    INTEGER     NOT NULL DEFAULT 0,
      created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- 按邮箱取最新未消费码（verifyOtp / issueOtp 冷却查询的主路径）。
    CREATE INDEX IF NOT EXISTS idx_email_otps_email_created
      ON email_otps (email, created_at DESC);
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS email_otps;`);
};
