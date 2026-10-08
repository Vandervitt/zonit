// 用户最后活跃时间。
//
// 为什么补：Google 登录走 JWT 且未接 adapter，accounts/sessions 表恒为空；只有 OTP 登录
// 在 email_otps 留痕。于是「注册后再没回来」与「回来了但没建页」在库里无法区分。
//
// 写入点在 jwt 回调（每个带会话的请求都会跑），按小时节流，见 lib/auth/last-seen.ts。
// 不回填：历史活跃无从得知，NULL 即「迁移后未出现过」。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("users", {
    last_seen_at: { type: "timestamptz" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("users", ["last_seen_at"]);
}
