// 分析区间的解析与环比（纯函数，无 DB 依赖）。
//
// ⚠️ 与 queries.ts 分开：后者 import 了 pg 连接池，分析页是客户端组件，
// 从那里引类型会把 pg 打进浏览器包。

/** 半开区间 [from, to)：闭区间会让「今天」在跨日时重复计入一天。 */
export interface DateRange {
  from: string;
  to: string;
  /** 天数（环比要取等长的上一段）。 */
  days: number;
}

/** 预设区间。自定义区间的天数上限，避免一次拉穿全表。 */
export const PRESET_DAYS = [7, 30, 90] as const;
export const MAX_RANGE_DAYS = 366;
export const DEFAULT_DAYS = 30;

const DAY_MS = 86_400_000;

/** 只认 YYYY-MM-DD；带时间的输入一律拒绝，避免时区歧义悄悄改变口径。 */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function startOfUtcDay(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

function parseDate(v: string): Date | null {
  if (!DATE_RE.test(v)) return null;
  const d = new Date(`${v}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const iso = (d: Date): string => d.toISOString();

/**
 * 解析区间入参。
 *
 * 自定义 from/to 优先；任一非法（格式错、颠倒、超上限）都回落到 days 预设，
 * 而不是报错——报表页不该因为一个坏 query 参数整页打不开。
 */
export function resolveRange(input: { days?: unknown; from?: unknown; to?: unknown }, now = new Date()): DateRange {
  const custom = resolveCustomRange(input.from, input.to, now);
  if (custom) return custom;

  const daysRaw = Number(input.days);
  const days = (PRESET_DAYS as readonly number[]).includes(daysRaw) ? daysRaw : DEFAULT_DAYS;
  // 预设区间含今天：to 取明天零点，使今天的数据完整计入。
  const to = new Date(startOfUtcDay(now).getTime() + DAY_MS);
  return { from: iso(new Date(to.getTime() - days * DAY_MS)), to: iso(to), days };
}

function resolveCustomRange(fromRaw: unknown, toRaw: unknown, now: Date): DateRange | null {
  if (typeof fromRaw !== "string" || typeof toRaw !== "string") return null;
  const from = parseDate(fromRaw);
  const toDay = parseDate(toRaw);
  if (!from || !toDay) return null;
  // 用户选的 to 是「含当天」，故右端取次日零点。
  const to = new Date(toDay.getTime() + DAY_MS);
  if (to <= from) return null;
  const days = Math.round((to.getTime() - from.getTime()) / DAY_MS);
  if (days > MAX_RANGE_DAYS) return null;
  // 未来的区间没有数据，但也不该报错：右端夹到明天零点即可。
  const cap = new Date(startOfUtcDay(now).getTime() + DAY_MS);
  const clamped = to > cap ? cap : to;
  const clampedDays = Math.max(Math.round((clamped.getTime() - from.getTime()) / DAY_MS), 1);
  return { from: iso(from), to: iso(clamped), days: clampedDays };
}

/**
 * 紧邻的等长上一段——环比的分母。
 *
 * 刻意用「等长且紧邻」而不是「上月同期」：投放的节奏按投放周期走，不按自然月。
 * 上一段与本段等长，两个数才可比。
 */
export function previousRange(range: DateRange): DateRange {
  const from = new Date(range.from);
  const to = new Date(range.to);
  const span = to.getTime() - from.getTime();
  return { from: iso(new Date(from.getTime() - span)), to: range.from, days: range.days };
}

/**
 * 环比变化率。上一段为 0 时返回 null 而不是 100%——
 * 「从 0 到 5」不是「增长 100%」，谎报一个百分比比不给更糟。
 */
export function changeRate(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

/** 区间内的日期序列（补零用），YYYY-MM-DD。 */
export function datesInRange(range: DateRange): string[] {
  const out: string[] = [];
  const from = new Date(range.from);
  const to = new Date(range.to);
  for (let t = from.getTime(); t < to.getTime(); t += DAY_MS) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}
