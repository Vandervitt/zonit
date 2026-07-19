export interface DailyPoint { day: string; count: number }

/** 把 SQL 按日聚合结果补齐为「近 days 天（含今天，UTC）」逐日序列，缺日计 0，升序。 */
export function fillDailySeries(rows: DailyPoint[], days: number, now: Date): DailyPoint[] {
  const byDay = new Map(rows.map((r) => [r.day, r.count]));
  const out: DailyPoint[] = [];
  const base = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(base.getTime() - i * 86400_000);
    const day = d.toISOString().slice(0, 10);
    out.push({ day, count: byDay.get(day) ?? 0 });
  }
  return out;
}
