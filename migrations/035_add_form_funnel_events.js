/** @type {import('node-pg-migrate').MigrationBuilder} */
// 表单漏斗埋点：原先只有 page_view / cta_click，看得到「有多少人来」，
// 看不到「多少人开始填表单却没提交」——表单已是主转化路径，这段是盲区。
// detail 用于承载 form_error 的错误码（bad_whatsapp 等），无 PII。
exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_check;
    ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_check
      CHECK (event IN ('page_view','cta_click','form_start','form_submit','form_error'));
    ALTER TABLE analytics_events ADD COLUMN IF NOT EXISTS detail TEXT;
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    DELETE FROM analytics_events WHERE event IN ('form_start','form_submit','form_error');
    ALTER TABLE analytics_events DROP COLUMN IF EXISTS detail;
    ALTER TABLE analytics_events DROP CONSTRAINT IF EXISTS analytics_events_event_check;
    ALTER TABLE analytics_events ADD CONSTRAINT analytics_events_event_check
      CHECK (event IN ('page_view','cta_click'));
  `);
};
