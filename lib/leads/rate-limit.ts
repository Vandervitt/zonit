// lib/leads/rate-limit.ts
// 内存滑动窗口频率限制（单实例足够；多实例一致性见 Future Work）。
interface Options {
  windowMs: number;
  max: number;
  now?: () => number;
}

export function createRateLimiter({ windowMs, max, now = Date.now }: Options) {
  const hits = new Map<string, number[]>();
  return {
    allow(key: string): boolean {
      const t = now();
      const arr = (hits.get(key) ?? []).filter((ts) => t - ts < windowMs);
      if (arr.length >= max) {
        hits.set(key, arr);
        return false;
      }
      arr.push(t);
      hits.set(key, arr);
      return true;
    },
  };
}

/** 进程级单例：线索提交限流（1 分钟 5 条/IP）。 */
export const leadRateLimiter = createRateLimiter({ windowMs: 60_000, max: 5 });
