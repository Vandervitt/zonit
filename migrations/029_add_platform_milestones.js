/** @type {import('node-pg-migrate').MigrationBuilder} */
// 平台激活漏斗里程碑：记录用户「首次达成」注册 → 建页 → 域名验证 → 发布 → 首线索，
// 供 super-admin 漏斗看板。(user_id, event) 主键天然幂等（首次达成语义）。
exports.up = (pgm) => {
  pgm.sql(`
    CREATE TABLE IF NOT EXISTS platform_milestones (
      user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      event      TEXT        NOT NULL CHECK (event IN ('signup','page_created','domain_verified','page_published','first_lead')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, event)
    );

    -- 存量回填（幂等）：让看板上线即有数。达成时间取各表既有时间近似；
    -- domains 无 verified_at，用 created_at 近似；已删除页/域名的历史达成无从回填，接受。
    INSERT INTO platform_milestones (user_id, event, created_at)
      SELECT id, 'signup', created_at FROM users
    ON CONFLICT DO NOTHING;

    INSERT INTO platform_milestones (user_id, event, created_at)
      SELECT user_id, 'page_created', MIN(created_at) FROM landing_pages GROUP BY user_id
    ON CONFLICT DO NOTHING;

    INSERT INTO platform_milestones (user_id, event, created_at)
      SELECT user_id, 'domain_verified', MIN(created_at) FROM domains WHERE verified = true GROUP BY user_id
    ON CONFLICT DO NOTHING;

    INSERT INTO platform_milestones (user_id, event, created_at)
      SELECT user_id, 'page_published', MIN(published_at) FROM landing_pages WHERE published_at IS NOT NULL GROUP BY user_id
    ON CONFLICT DO NOTHING;

    INSERT INTO platform_milestones (user_id, event, created_at)
      SELECT p.user_id, 'first_lead', MIN(l.created_at)
        FROM leads l JOIN landing_pages p ON p.id = l.page_id
       GROUP BY p.user_id
    ON CONFLICT DO NOTHING;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`DROP TABLE IF EXISTS platform_milestones;`);
};
