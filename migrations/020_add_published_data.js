/** @type {import('node-pg-migrate').MigrationBuilder} */
// 发布快照：published_data 保存「点发布那一刻」的页面内容，公开渲染只读它；
// data 继续作为编辑草稿，编辑已发布页不再实时影响线上。
// 回填：存量已发布页以当前 data 作为线上快照，行为与迁移前一致。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE landing_pages ADD COLUMN IF NOT EXISTS published_data JSONB;
    UPDATE landing_pages SET published_data = data WHERE status = 'published' AND published_data IS NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    ALTER TABLE landing_pages DROP COLUMN IF EXISTS published_data;
  `);
};
