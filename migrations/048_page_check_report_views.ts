// 自检报告的浏览记录。
//
// 为什么需要：外发时每个收件人拿到的是**一条唯一的报告 URL**，因此「这条 URL 被
// 打开过」天然等价于该收件人的打开信号。不需要追踪像素、不需要第三方、不需要在
// 邮件正文里塞任何东西——服务端渲染一次就是一次真实访问。
//
// ⚠️ 邮件安全网关与链接扫描器（Proofpoint / Mimecast / Barracuda 等）会主动抓取
// 邮件里的每一条 URL，这类抓取在服务端与真人打开**完全同形**。不加区分的话，
// 打开率会被系统性高估到不可用——而「打开率不可信」正是这套记录要解决的问题本身。
// 故本表**如实记录每一次访问**，另存 UA 与 is_bot 标记，由读取侧决定口径。
// 写入时就把疑似机器人丢掉是错的：判断错了再也补不回来，留着则随时可以重新算。
//
// is_creator 同理：自己生成报告时也会看一眼自己的报告，那一次不能算对方打开了。
// 判断在 SQL 里做（比对报告行上的 ip_hash），应用侧拿不到、也不需要拿到创建者哈希。
//
// 单张表同时承载单页报告与多页对比：两者是分开的实体、都需要级联清理，
// 因此用两个可空外键 + CHECK 约束保证恰好命中一个，而不是 (kind, id) 这种
// 无法建立外键的写法——外键在这里是清理正确性的保证，不能为了表结构好看放弃。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    CREATE TABLE page_check_report_views (
      id         BIGSERIAL   PRIMARY KEY,
      report_id  TEXT        REFERENCES page_check_reports(id) ON DELETE CASCADE,
      batch_id   TEXT        REFERENCES page_check_batches(id) ON DELETE CASCADE,
      viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      -- 仅用于识别重复访问与创建者自看，存哈希不存明文 IP（与报告表同一口径）。
      ip_hash    TEXT,
      user_agent TEXT,
      is_bot     BOOLEAN     NOT NULL DEFAULT FALSE,
      is_creator BOOLEAN     NOT NULL DEFAULT FALSE,
      CONSTRAINT page_check_report_views_subject
        CHECK ((report_id IS NULL) <> (batch_id IS NULL))
    );
    CREATE INDEX idx_page_check_report_views_report ON page_check_report_views (report_id, viewed_at);
    CREATE INDEX idx_page_check_report_views_batch  ON page_check_report_views (batch_id, viewed_at);
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP TABLE IF EXISTS page_check_report_views;`);
}
