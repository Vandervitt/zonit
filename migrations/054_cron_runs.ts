// 每日 cron 的执行记录，供 super-admin 看板判断「今天跑了没、哪个子任务挂了」。
//
// 为什么落库：cron 曾五周从未执行（PR#140），而子任务失败时整体照样返回 200，
// 之前只能翻 Vercel 日志 grep「failed」才知道。记录保留 90 天，由写入方顺手清理。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("cron_runs", {
    id: { type: "bigserial", primaryKey: true },
    job: { type: "text", notNull: true },
    started_at: { type: "timestamptz", notNull: true },
    finished_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    failed_tasks: { type: "text[]", notNull: true, default: pgm.func("'{}'::text[]") },
    result: { type: "jsonb", notNull: true, default: pgm.func("'{}'::jsonb") },
  });
  // 看板恒按 job 取最近若干次。
  pgm.createIndex("cron_runs", ["job", { name: "started_at", sort: "DESC" }]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("cron_runs");
}
