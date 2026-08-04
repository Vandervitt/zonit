// 线索备注、标签与归档。
//
// 与被否决的「线索状态机」是两回事，别再混为一谈：状态机之所以否决，是因为平台
// 拿不到任何能自动推进状态的信号，逼客户手工维护一块不准的看板比没有更糟。
// 备注与标签不依赖任何自动信号——它们就是客户自己写下的那句话，写与不写都成立。
//
// 为什么标签用 text[] 而不是单独一张关联表：标签是自由文本、每条线索至多几个、
// 没有独立生命周期（不需要重命名、合并、权限）。开一张表在这里只会换来
// 每次列表查询多一次 JOIN。真需要标签管理时再拆不迟。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("leads", {
    // 跟进备注。「这个客户说下周再聊」这类信息此前无处可记。
    note: { type: "text" },
    // 自由标签。默认空数组而非 NULL，读取侧不必到处判空。
    tags: { type: "text[]", notNull: true, default: "{}" },
    // 归档：处理完的线索从默认视图里收起，但不删除——线索是花钱买来的。
    archived_at: { type: "timestamptz" },
  });

  // 默认视图是「未归档」，且几乎总是按页 + 时间取。
  pgm.createIndex("leads", ["page_id", "created_at"], {
    name: "leads_page_active_idx",
    where: "archived_at IS NULL",
  });

  // 按标签筛选走数组包含判断，GIN 是它唯一有效的索引类型。
  pgm.createIndex("leads", "tags", { name: "leads_tags_gin_idx", method: "gin" });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropIndex("leads", "tags", { name: "leads_tags_gin_idx" });
  pgm.dropIndex("leads", ["page_id", "created_at"], { name: "leads_page_active_idx" });
  pgm.dropColumns("leads", ["note", "tags", "archived_at"]);
}
