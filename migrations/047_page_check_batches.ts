// 多页对比报告（一次提交多个 URL，出一张横向对比表）。
//
// 设计取舍：**批次只是一层分组，不复制报告内容。**
// 每个 URL 仍各自跑一遍单页检查并存成一条 page_check_reports，批次表只记录
// 「这几条属于同一次提交」。因此：
//   · 单页报告页 /r/<id> 对批次内的每条依然独立可访问，无需另写渲染逻辑
//   · findings 只有一处真源，不会出现「对比表和详情页说法不一致」
//   · 30 天过期与 cron 清理沿用报告自身的 expires_at，批次不需要第二套生命周期
//
// ⚠️ 全库 id 均为 text，勿引入整型主键。
// ⚠️ 批次 id 与报告 id 同为不可猜测的 21 位随机串——批次链接同样是「持有即可见」。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("page_check_batches", {
    id: { type: "text", primaryKey: true },
    locale: { type: "text", notNull: true, default: "en" },
    ip_hash: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    expires_at: { type: "timestamptz", notNull: true },
  });

  pgm.createTable("page_check_batch_items", {
    batch_id: {
      type: "text",
      notNull: true,
      references: "page_check_batches",
      onDelete: "CASCADE",
    },
    // 指向单页报告。报告过期被清理时这条也跟着走，避免批次页出现悬空条目。
    report_id: {
      type: "text",
      notNull: true,
      references: "page_check_reports",
      onDelete: "CASCADE",
    },
    // 保持用户提交时的顺序：对比表按提交顺序排列，而不是按检查完成的先后。
    position: { type: "integer", notNull: true },
  });

  pgm.addConstraint("page_check_batch_items", "page_check_batch_items_pkey", {
    primaryKey: ["batch_id", "report_id"],
  });
  pgm.createIndex("page_check_batch_items", "report_id");
  pgm.createIndex("page_check_batches", "expires_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("page_check_batch_items");
  pgm.dropTable("page_check_batches");
}
