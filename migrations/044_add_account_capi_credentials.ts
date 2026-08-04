// 账号级 CAPI 凭据：同一个广告主的多张页共用一份 Access Token。
//
// 为什么加这一层而不是把 page_capi_credentials 改成账号级：两种粒度都真实存在。
// 代投同时管多个客户，每个客户有各自的 Dataset —— 那是页级；而同一个客户的十张
// 落地页共用同一个 Dataset —— 那是账号级。原来只有页级，于是同一份 token 要手工
// 贴十遍，改期还得逐页改回来。
//
// 解析顺序在 lib/capi/credentials.ts：页级优先，页级没配的 provider 落到账号级。
// 即「账号级是默认值，页级是覆盖」，两者都保留才能同时服务上面两种情形。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("user_capi_credentials", {
    id: { type: "bigserial", primaryKey: true },
    // ⚠️ 全库 id 均为 text，user_id 同样是 text，不要引入整型。
    user_id: { type: "text", notNull: true, references: "users", onDelete: "CASCADE" },
    provider: { type: "text", notNull: true, check: "provider IN ('meta','tiktok')" },
    // 仅服务端读，永不下发客户端（与页级凭据同口径）。
    access_token: { type: "text", notNull: true },
    external_id: { type: "text", notNull: true },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("user_capi_credentials", "user_capi_credentials_user_provider_key", {
    unique: ["user_id", "provider"],
  });

  // 回传健康度按「租户 + 时间」查（后台面板），原索引是 (status, created_at)，
  // 覆盖不到按页过滤的场景。
  pgm.createIndex("capi_events", ["page_id", "created_at"]);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("capi_events", ["page_id", "created_at"]);
  pgm.dropTable("user_capi_credentials");
}
