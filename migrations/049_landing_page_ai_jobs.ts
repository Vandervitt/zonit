// AI 一键成页改成异步：跨太平洋调用 DashScope 单次就要 60+ 秒，两次重试叠加常超 2 分钟，
// 同步 HTTP 请求扛不住——任何一层代理都可能在中途掐断连接（见 PR #195/#196 的排查记录）。
//
// 落地页本身（landing_pages.data）不再是生成结果的唯一载体：先建一条 job 记录，
// 后台跑完再回写 landing_pages 并把 job 标终态；前端轮询 job 状态，成功后再取一次页面数据。
//
// ⚠️ 全库 id 均为 text，与 landing_pages.id 同一套 gen_random_uuid()::text 生成方式。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("landing_page_ai_jobs", {
    id: { type: "text", primaryKey: true, default: pgm.func("(gen_random_uuid())::text") },
    user_id: { type: "text", notNull: true },
    page_id: { type: "text", notNull: true, references: "landing_pages", onDelete: "CASCADE" },
    // pending：后台任务还没跑完；succeeded/failed 为终态，前端轮询到即停止。
    status: { type: "text", notNull: true, default: "pending" },
    // 失败原因（ComplianceReason | "model_error" | "ai_quota_exhausted" 等），成功时为空。
    reason: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("landing_page_ai_jobs", "landing_page_ai_jobs_status_check", {
    check: "status IN ('pending', 'succeeded', 'failed')",
  });

  // 轮询按 id 主键查，这条是给「查某用户/某页历史任务」这类运维场景用的。
  pgm.createIndex("landing_page_ai_jobs", "page_id");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("landing_page_ai_jobs");
}
