// 获客归因两列：用户的注册首触来源、落地页从哪个模板建出。
//
// 为什么补：2026-10-20 的产品 review 无法回答「注册从哪来」「谁在用 B2B 模板」——
// 用户表没有来源，建页只存了模板名（用户一改名就丢）。两列都可空、不回填：
// 老数据无法准确推断，猜出来的值比空值更误导。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns(
    "users",
    {
      // 浏览器自报、服务端白名单校验后写入一次（见 lib/attribution/signup-source.ts）。
      signup_source: { type: "jsonb" },
    },
    { ifNotExists: true },
  );
  pgm.addColumns(
    "landing_pages",
    {
      template_id: { type: "text" },
    },
    { ifNotExists: true },
  );
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("landing_pages", ["template_id"], { ifExists: true });
  pgm.dropColumns("users", ["signup_source"], { ifExists: true });
}
