// 超管对用户的跟进备注（如「10-08 已发回访邮件」），防止重复联系、知道谁在跟。
//
// 用流水表而不是 users 上的一个文本列：跟进是一串带时间与作者的动作，覆盖式文本会丢历史。
// ⚠️ 全库 id 均为 text。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("user_admin_notes", {
    id: { type: "text", primaryKey: true, default: pgm.func("(gen_random_uuid())::text") },
    user_id: { type: "text", notNull: true, references: "users", onDelete: "CASCADE" },
    // 作者被删不应连带抹掉跟进记录。
    author_id: { type: "text", references: "users", onDelete: "SET NULL" },
    body: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  // 详情抽屉按用户取、时间倒序；列表页取每人最新一条。
  pgm.createIndex("user_admin_notes", ["user_id", { name: "created_at", sort: "DESC" }]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("user_admin_notes");
}
