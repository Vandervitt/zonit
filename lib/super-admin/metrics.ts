// super-admin 运营统计的统一口径。所有看板查询都应从这里取过滤条件，
// 否则「哪些人算用户」会在各处各写一份，迟早又对不上。

/**
 * 外部（真实）用户判定，要求 users 表别名为 u。
 * 超管恒视为内部：登录时会被硬写成 agency 档，不排除就会被算成付费用户。
 */
export const EXTERNAL_USER = `(NOT u.is_internal AND u.role <> 'SUPER_ADMIN')`;

/**
 * 真实付费：持有渠道订阅且当前档位非 free。
 * 不能只看 plan != 'free'：超管与历史手工改库都会让 plan 脱离订阅事实。
 * 周期末取消的订阅在到期前仍算付费（权益仍在）。
 */
export const PAID_USER = `(u.billing_subscription_id IS NOT NULL AND u.plan <> 'free')`;

export const STATS_RANGES = ["30", "90", "all"] as const;
export type StatsRange = (typeof STATS_RANGES)[number];

export function parseStatsRange(raw: unknown): StatsRange {
  return (STATS_RANGES as readonly unknown[]).includes(raw) ? (raw as StatsRange) : "30";
}

/** 时间窗条件。range 已经白名单校验，拼进 SQL 是安全的。 */
export function rangeSinceSql(range: StatsRange, column: string): string {
  return range === "all" ? "TRUE" : `${column} > NOW() - INTERVAL '${range} days'`;
}

/** 百分比，按位数向下截断（全局约定：率只舍不入）；分母为 0 返回 null。 */
export function ratePercent(numerator: number, denominator: number, digits: number): number | null {
  if (denominator <= 0) return null;
  const factor = 10 ** digits;
  // 先乘再取整会被浮点误差咬到（如 0.58*100=57.99…），用字符串精度修正一次。
  const scaled = Number(((numerator / denominator) * 100 * factor).toPrecision(12));
  return Math.floor(scaled) / factor;
}

/** 环比变化（%，整数，向零截断：只舍不入）；上周为 0 时无从比较，返回 null。 */
export function weekOverWeek(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return Math.trunc(Number((((current - previous) / previous) * 100).toPrecision(12)));
}
