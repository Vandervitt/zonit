// 试用/赠送到期邮件序列的幂等标记（T-3 提醒、T+0 到期、T+1 挽回）。
//
// 为什么建表而不是给 users 加列：一列存不下三个阶段；且超管可以对同一用户
// 二次赠送，那时整个序列应当重跑。把 grant_expires_at（赠送的到期时刻）放进
// 主键，等于用到期时刻标识赠送实例——新的赠送有新的到期时刻，天然重新开始。
//
// ⚠️ 全库 id 均为 text，user_id 同样是 text，不要引入整型。
//
// 写入沿用 platform_milestones 的 ON CONFLICT DO NOTHING 幂等写法。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("trial_emails", {
    user_id: {
      type: "text",
      notNull: true,
      references: "users",
      onDelete: "CASCADE",
    },
    stage: { type: "text", notNull: true },
    grant_expires_at: { type: "timestamptz", notNull: true },
    sent_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.addConstraint("trial_emails", "trial_emails_pkey", {
    primaryKey: ["user_id", "stage", "grant_expires_at"],
  });

  pgm.addConstraint("trial_emails", "trial_emails_stage_check", {
    check: "stage IN ('t_minus_3', 'expiry_day', 'win_back')",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("trial_emails");
}
