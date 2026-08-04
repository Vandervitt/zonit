// 归因维度补齐：utm_term / utm_content（曝光与线索都要）+ 点击 ID（只落线索）。
//
// 为什么补：落地页前端一直用 parseUtm 捕获全套 UTM 与点击 ID（见
// landing-renderer/tracking/utm.ts），但库里只有 source/medium/campaign 三列，
// 多出来的维度在服务端被静默丢掉。结果是后台只能回答「哪个渠道」，
// 回答不了「哪条广告、哪个创意」——而后者才是投放侧真正要看的粒度。
//
// 为什么点击 ID 只落 leads 不落 analytics_events：点击 ID 的用途是拿单条线索
// 去广告后台对账，是逐条查的。analytics_events 是高频流水（每次 page_view 一行），
// 存基数极高且永不重复的字符串既没有聚合价值，又白白放大表体积。
//
// 为什么三个点击 ID 分列而不是「click_id + 来源」两列：一次访问同时带上
// gclid 与 fbclid 是可能的（跨平台再营销链接互相透传），合并成一列就得挑一个丢一个。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.addColumns("analytics_events", {
    utm_term: { type: "text" },
    utm_content: { type: "text" },
  });

  pgm.addColumns("leads", {
    utm_term: { type: "text" },
    utm_content: { type: "text" },
    // Google / Meta / TikTok 的点击 ID，用于与广告后台逐条对账。
    gclid: { type: "text" },
    fbclid: { type: "text" },
    ttclid: { type: "text" },
  });
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.dropColumns("analytics_events", ["utm_term", "utm_content"]);
  pgm.dropColumns("leads", ["utm_term", "utm_content", "gclid", "fbclid", "ttclid"]);
}
