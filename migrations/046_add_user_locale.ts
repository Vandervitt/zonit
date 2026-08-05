// 用户界面语言偏好。此前 /admin 后台固定中文（见 lib/plans.ts 文件头原注释），
// 本列是把后台改成中英双语的存储基座。
//
// 为什么可空而不给 default：NULL 表达「此人从未表过态」，与「显式选了 en」必须可区分。
// 若给 default，新用户会被静默钉到某个语言，读取侧再也无法判断该不该按注册来源
// （zb_locale cookie）回退——而注册来源正是新用户唯一可用的语言线索。
//
// 存量行则显式 backfill 成 'zh'：这些是改造前就在用的中文客户，绝不能让他们
// 下次登录突然看到英文界面。他们「表过态」这件事由产品历史而非用户操作确立。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("users", {
    locale: { type: "text" },
  });

  // 取值必须与 lib/i18n/config.ts 的 locales 一致。加约束是因为这一列会被
  // 注册路径、设置页 API、超管改档等多处写入，任一处写错都只会在渲染时静默回退，
  // 不会报错——那种 bug 极难定位。
  pgm.addConstraint("users", "users_locale_check", {
    check: "locale IS NULL OR locale IN ('en', 'zh')",
  });

  // 存量用户一律钉中文。写在迁移里而不是靠读取侧默认值，是为了让「老客户看中文」
  // 成为数据事实，不随以后 defaultLocale 改动而漂移。
  pgm.sql(`UPDATE users SET locale = 'zh' WHERE locale IS NULL`);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropConstraint("users", "users_locale_check");
  pgm.dropColumns("users", ["locale"]);
}
