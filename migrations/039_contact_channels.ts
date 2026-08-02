// 留资渠道通用化：把 landing_pages 的 data / published_data 从「CTA 裸 URL」
// 转成「contact 真源 + target 引用」。
//
// ⚠️ 本迁移由 vercel-build 自动执行，没有人工 dry-run 窗口，且生产 DB 连接串是
// Vercel sensitive env（拉不回值，无法用真实数据预演）。故安全性由**事务内自校验**保证：
// 逐张比对转换前后 CTA 的 (文案, href) 清单，任何一张不等即 throw ——
// 事务回滚、部署失败、生产保持旧代码旧数据。失败的默认结果是「什么都没发生」。
//
// 这比人工看 dry-run 报告更可靠：它检查全部数据而不是抽样。
//
// 不强行归一号码：同页出现第二个不同的 WhatsApp 号是合法状态（用户手改过其一），
// 那类落点原样转成 { kind: "url" }。宁可留一个未接入新模型的落点，
// 也不能改掉客户正在投放的页面。
//
// 文件名是 .ts —— migrate 脚本已改用 tsx 执行，故转换逻辑与运行时是同一份实现，
// 不存在「迁移抄一份、应用用另一份」导致的分叉。
import type { MigrationBuilder } from "node-pg-migrate";
import { convertDraft, isConverted } from "../lib/contact/convert-draft";
import { ctaInventory, legacyCtaInventory, type LegacyDraft } from "../lib/contact/cta-inventory";

/** 转换一份 draft 并当场验证等价；不等则抛错让整个迁移回滚。 */
function convertVerified(legacy: LegacyDraft | null, label: string) {
  if (!legacy) return null;
  // 已转换的直接放行：等价性判据是拿旧形状算 href，对新形状不成立
  if (isConverted(legacy)) return legacy;
  const next = convertDraft(legacy);
  const before = legacyCtaInventory(legacy);
  const after = ctaInventory(next);
  if (JSON.stringify(before) !== JSON.stringify(after)) {
    throw new Error(
      `[039] ${label} 的 CTA 清单在转换后发生变化，迁移中止。\n` +
        `  转换前: ${JSON.stringify(before)}\n` +
        `  转换后: ${JSON.stringify(after)}`,
    );
  }
  return next;
}

export const up = async (pgm: MigrationBuilder) => {
  // 备份整表，回滚脚本从它恢复。CTAS 不带索引与约束，纯数据留存即可。
  //
  // ⚠️ 必须用 pgm.db.query 而不是 pgm.sql：后者是**排队**执行的，会等 up() 返回后
  // 才真正跑，也就是排在下面的 UPDATE 之后——那样备份到的是已经转换完的数据，
  // 备份表形同虚设、回滚彻底失效。这不是理论风险，本地实测踩到过。
  await pgm.db.query(
    `CREATE TABLE IF NOT EXISTS landing_pages_backup_pre_contact AS SELECT * FROM landing_pages;`,
  );

  const { rows } = await pgm.db.query(`SELECT id, data, published_data FROM landing_pages;`);
  let converted = 0;
  for (const row of rows) {
    const data = convertVerified(row.data, `页面 ${row.id} 的草稿`);
    const published = convertVerified(row.published_data, `页面 ${row.id} 的发布快照`);
    await pgm.db.query(`UPDATE landing_pages SET data = $2, published_data = $3 WHERE id = $1;`, [
      row.id,
      data ? JSON.stringify(data) : null,
      published ? JSON.stringify(published) : null,
    ]);
    converted += 1;
  }
  console.log(`[039] 已转换 ${converted} 张页面，CTA 清单逐张等价校验通过`);
};

export const down = (pgm: MigrationBuilder) => {
  // 从备份恢复。备份表刻意不删 —— 留作事故对照，容量成本可忽略。
  pgm.sql(`
    UPDATE landing_pages lp
       SET data = b.data, published_data = b.published_data
      FROM landing_pages_backup_pre_contact b
     WHERE lp.id = b.id;
  `);
};
