/** @type {import('node-pg-migrate').MigrationBuilder} */
// 未读线索提醒：记录该条线索已被提醒过的时间，保证「每条线索最多提醒一次」，
// 不会因为客户一直没读就天天发同一封（提醒变骚扰就等于没有提醒）。
// 配套的部分索引只覆盖候选集（未读且未提醒过），避免全表扫描。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS nudged_at TIMESTAMPTZ;
    CREATE INDEX IF NOT EXISTS idx_leads_nudge_candidates
      ON leads (created_at)
      WHERE is_read = false AND nudged_at IS NULL;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DROP INDEX IF EXISTS idx_leads_nudge_candidates;
    ALTER TABLE leads DROP COLUMN IF EXISTS nudged_at;
  `);
};
