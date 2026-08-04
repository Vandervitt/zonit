// 账号级经营主体信息（页脚公司信息 / 执照）。
//
// 为什么是独立表而不是落地页 draft 里的一段文案：主体信息属于账号，不属于某张页。
// 一个账号可能有多份（不同法律实体、不同市场各一份），同一份被多张页引用；地址或
// 执照号变更时必须一次改完所有已发布页。存进 draft 就等于当场分裂成 N 份互相矛盾
// 的主体信息，且改一处要逐页重发。落地页 draft 只存 footer.companyProfileId 引用。
//
// 为什么拆成字段而不是一个 textarea：平台要的是具体项 —— TikTok 对电商与金融类
// 明确要求页脚展示公司信息与执照。拆开才能在发布前逐项提示缺什么，
// 也才能保证渲染出的那一行格式稳定（见 lib/company-profiles/format.ts）。
//
// ⚠️ 全库 id 均为 text，user_id 同样是 text，不要引入整型。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.createTable("company_profiles", {
    id: { type: "text", primaryKey: true },
    user_id: { type: "text", notNull: true, references: "users", onDelete: "CASCADE" },
    // 用户自己用来区分多份主体的名字（如「英国实体」），只在后台可见，不上落地页。
    label: { type: "text", notNull: true },
    // 法律实体名。唯一必填项：没有它这份主体信息对审核毫无意义。
    legal_name: { type: "text", notNull: true },
    address: { type: "text", notNull: true, default: "" },
    // 公司注册号 / 统一社会信用代码。
    registration_no: { type: "text", notNull: true, default: "" },
    // 行业执照或许可证编号（医疗、金融、法律等高监管行业按平台要求展示）。
    license: { type: "text", notNull: true, default: "" },
    is_default: { type: "boolean", notNull: true, default: false },
    created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
  });

  pgm.createIndex("company_profiles", ["user_id", "created_at"]);

  // 每个账号至多一份默认主体：新建页时用它预选，省掉「每张页都要挑一次」。
  // 用部分唯一索引而非 CHECK —— 约束的是「同一 user 只能有一行 is_default=true」。
  pgm.createIndex("company_profiles", "user_id", {
    name: "company_profiles_one_default_per_user",
    unique: true,
    where: "is_default",
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropTable("company_profiles");
}
