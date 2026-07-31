// 平台子域（试用期零门槛发布）：标记哪些 domains 记录是平台分配的子域。
//
// 不新建表 —— 平台子域就是一条普通的 domains 记录，只是 verified/enabled 由平台
// 直接置 true（域名本来就是我们的，无需 DNS 验证）。这样发布、多路径、配额对账、
// 取消发布等全部现有逻辑天然适用，租户解析链路一行都不用改。
//
// 该列的两个用途：
//   ① 额度：平台子域不占 domainsLimit（Free 是 0，否则一分配就超限）
//   ② UI：不展示 DNS 配置指引与「未指向本平台」橙标——它们对平台域没有意义
/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE domains
      ADD COLUMN IF NOT EXISTS is_platform_subdomain BOOLEAN NOT NULL DEFAULT false;

    -- 每用户至多一个平台子域：既限制滥用，也配合多路径发布——
    -- 一个子域下按路径发多张页，试用期 Pro 的 20 张额度完全够用。
    CREATE UNIQUE INDEX IF NOT EXISTS idx_domains_one_platform_subdomain
      ON domains(user_id) WHERE is_platform_subdomain = true;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_domains_one_platform_subdomain;
    ALTER TABLE domains DROP COLUMN IF EXISTS is_platform_subdomain;
  `);
};
