// 落地页自检器的报告存储。
//
// 报告链接是公开可分享的，安全性完全依赖 id 不可猜测——故 id 由应用侧生成
// 并使用 URL 安全字母表（见 lib/tools/report-id.ts），DB 侧不设默认值，
// 避免出现「有人直接 INSERT 出一个可枚举 id」的路径。
//
// ⚠️ 全库 id 均为 text，不要在此引入整型主键破坏一致性。
//
// 保留 30 天：由 app/api/cron/daily 的清理子任务按 expires_at 删除，
// 与 pruneRateLimitHits 等同类子任务并列。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("page_check_reports", {
    id: { type: "text", primaryKey: true },
    // 用户提交的原始 URL 与实际抓到的最终 URL 分开存：跳转链本身是一条检查项，
    // 两者不一致恰恰是要展示给用户看的信息。
    input_url: { type: "text", notNull: true },
    final_url: { type: "text", notNull: true, default: "" },
    host: { type: "text", notNull: true },
    locale: { type: "text", notNull: true, default: "en" },
    status: { type: "integer", notNull: true, default: 0 },
    bytes: { type: "integer", notNull: true, default: 0 },
    hops: { type: "integer", notNull: true, default: 0 },
    findings: { type: "jsonb", notNull: true, default: "[]" },
    // 是否经浏览器实测（登录用户走 Sandbox）。匿名报告恒为 false，
    // 报告页据此决定展示「疑似」还是「实测」。
    browser_verified: { type: "boolean", notNull: true, default: false },
    // 仅用于滥用溯源，存哈希不存明文 IP。
    ip_hash: { type: "text" },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    expires_at: { type: "timestamptz", notNull: true },
  });

  // 同一 URL 的短期缓存查询：按 host + input_url 找最近一条。
  pgm.createIndex("page_check_reports", ["host", "created_at"]);
  // 过期清理扫描。
  pgm.createIndex("page_check_reports", "expires_at");
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("page_check_reports");
}
