// 内部账号标记：超管、测试号不应进入任何运营统计。
//
// 为什么补：概览的「付费订阅」按 plan != 'free' 计，而超管登录时会被硬写成 agency、
// 测试号带真实订阅——生产 9 个用户里「付费」3 个全是内部号，转化率显示 33% 实为 0%。
//
// 判定口径（见 lib/super-admin/metrics.ts 的 EXTERNAL_USER）：is_internal OR role = SUPER_ADMIN。
// 超管恒视为内部，故这里不回填；测试号由超管在用户页手动标记。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("users", {
    is_internal: { type: "boolean", notNull: true, default: false },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("users", ["is_internal"]);
}
