// 曝光去重：给 analytics_events 补访客标识。
//
// 为什么补：建表（013）时只存事件流水，所有查询都是 count(*)，
// 于是「曝光」实际是 PV——刷新一次、返回再进一次都各记一行。市场上问的
// 「2000 人次访问却没询盘」用的是访客口径，我们答不了；而任何以曝光为分母的
// 「转化率」也就都不是行业口径。
//
// ⚠️ **口径断裂是刻意接受的，不做回填。**
// 历史行没有 visitor_hash，且**无法补算**——原始 IP / UA 从未落库（这张表的
// 设计前提就是无 PII）。因此读取侧对迁移前的时段必须返回 null 并显式呈现
// 「该时段无此数据」：
//   · 补 0 是撒谎（那段时间明明有访客）；
//   · 回退成 PV 更糟——两个口径混进同一根曲线，读者会把口径变化读成流量暴跌。
// 与自检器 unknown 档同一条原则：宁可说「看不出来」，不给假确定。
//
// visitor_hash 本身不是 PII：服务端用 IP + UA + page_id + **按天轮换的盐** 取
// SHA-256，明文不落库、跨天不可关联（见 lib/analytics/visitor.ts 对口径的说明）。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("analytics_events", {
    visitor_hash: { type: "text" },
  });
  // 去重查询恒定按 (page_id, 时间窗) 过滤后再 COUNT(DISTINCT visitor_hash)。
  // 部分索引跳过历史 NULL 行——它们永远不参与去重统计，没必要进索引。
  pgm.sql(`
    CREATE INDEX idx_analytics_visitor
      ON analytics_events (page_id, created_at, visitor_hash)
      WHERE visitor_hash IS NOT NULL
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`DROP INDEX IF EXISTS idx_analytics_visitor`);
  pgm.dropColumns("analytics_events", ["visitor_hash"]);
}
