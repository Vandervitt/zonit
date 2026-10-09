// 超管操作审计：谁在什么时候给谁赠送了什么、禁用了谁、改了谁的角色。
//
// 现在只有一个超管时还不显眼，但「设为超管」是现成的入口，超管一多，
// 「这个用户为什么是 Pro / 为什么被封」就再没人答得上来。
// actor 被删保留记录（SET NULL）；目标用户被删则其审计一并删除（CASCADE），
// 与 user_admin_notes 同口径。⚠️ 全库 id 均为 text。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("admin_audit_logs", {
    id: { type: "bigserial", primaryKey: true },
    actor_id: { type: "text", references: "users", onDelete: "SET NULL" },
    target_user_id: { type: "text", notNull: true, references: "users", onDelete: "CASCADE" },
    action: { type: "text", notNull: true },
    // 变更前后的值，形如 { before: {...}, after: {...} }。
    detail: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });
  pgm.createIndex("admin_audit_logs", ["target_user_id", { name: "created_at", sort: "DESC" }]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("admin_audit_logs");
}
