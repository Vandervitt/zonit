// 多路径发布 P1：把「域名 → 落地页」的 1:1 绑定升级为「域名 + 路径 → 落地页」。
//
// 本次仅换解析依据，不开放多路径：发布仍只写根路径 '/'，对外行为完全不变。
// domains.landing_page_id 保留且继续双写 —— 它是全部客户页面的解析依据，
// 一旦只写新表而新链路有问题，回滚代码后旧列已陈旧，所有页面同时下线。
// 待生产稳定、P2 开放多路径后，再单独迁移停止双写并删列。
/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS domain_routes (
      id              TEXT        PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
      domain_id       TEXT        NOT NULL REFERENCES domains(id) ON DELETE CASCADE,
      path            TEXT        NOT NULL,
      landing_page_id TEXT        NOT NULL REFERENCES landing_pages(id) ON DELETE CASCADE,
      created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      -- 规范化后的路径：恒以 / 开头，除根外无尾斜杠，仅小写字母数字与连字符。
      CONSTRAINT domain_routes_path_shape CHECK (path = '/' OR path ~ '^(/[a-z0-9-]+){1,2}$')
    );

    -- 同一域名下路径唯一（解析主键）
    CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_routes_domain_path
      ON domain_routes(domain_id, path);

    -- 一张落地页只能发布到一个位置（设计决策 D7）
    CREATE UNIQUE INDEX IF NOT EXISTS idx_domain_routes_page
      ON domain_routes(landing_page_id);

    CREATE INDEX IF NOT EXISTS idx_domain_routes_domain
      ON domain_routes(domain_id);

    -- 存量回填：既有绑定一律落到根路径
    INSERT INTO domain_routes (domain_id, path, landing_page_id)
    SELECT id, '/', landing_page_id
      FROM domains
     WHERE landing_page_id IS NOT NULL
    ON CONFLICT DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_domain_routes_domain;
    DROP INDEX IF EXISTS idx_domain_routes_page;
    DROP INDEX IF EXISTS idx_domain_routes_domain_path;
    DROP TABLE IF EXISTS domain_routes;
  `);
};
