// 访客标识：给曝光去重用的匿名哈希。
//
// ⚠️ **口径必须说清楚：这是「按天去重的访客数」，不是「独立访客数」。**
// 盐每天轮换，所以同一个人第二天再来会算作新的访客。跨越多天的区间里，
// 一个每天都来的人会被计多次。这是无 cookie 分析的通行做法（Plausible 同样
// 如此），代价是跨天不可去重，换来的是不持有任何可长期关联到个人的标识。
//
// 为什么不用稳定哈希：去掉日期后确实能算出真正的「独立访客」，但那就得到了一个
// 长期稳定的假名标识符——在 GDPR 下属于个人数据，而 analytics_events 这张表的
// 设计前提是无 PII（见 013 建表注释）。为了一个指标把整张表的性质改掉不值得。
//
// 为什么不用 cookie：落地页对欧盟访客有同意门控，埋点本身就在门控之后；
// 再引入 cookie 只会把同意范围扩大，且 cookie 会被清、被拦，未必更准。
import { createHash } from "node:crypto";

/**
 * 当天的盐。掺入服务端密钥，避免「IP + UA」这种低熵组合被离线穷举还原
 * （IPv4 只有 2^32，没有密钥的哈希等于没保护）。
 */
function dailySalt(now: Date): string {
  const day = now.toISOString().slice(0, 10);
  return `${process.env.AUTH_SECRET ?? "urgizat-analytics"}:${day}`;
}

/**
 * 算访客哈希。缺 IP 时返回 null——宁可这一行不参与去重，也不要把所有
 * 拿不到 IP 的访问折叠成同一个「访客」（那会让 UV 被系统性低估）。
 */
export function visitorHash(
  ip: string | null | undefined,
  userAgent: string | null | undefined,
  pageId: string,
  now: Date = new Date(),
): string | null {
  if (!ip || ip === "unknown") return null;
  return createHash("sha256")
    .update(`${dailySalt(now)}|${ip}|${userAgent ?? ""}|${pageId}`)
    .digest("hex");
}
