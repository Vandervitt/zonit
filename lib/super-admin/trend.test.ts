import { describe, it, expect } from "vitest";
import { fillDailySeries } from "@/lib/super-admin/trend";

describe("fillDailySeries（近 N 天逐日补零）", () => {
  const now = new Date("2026-07-20T10:00:00Z");
  it("空数据返回 N 个零点，日期升序", () => {
    const s = fillDailySeries([], 7, now);
    expect(s).toHaveLength(7);
    expect(s[0]).toEqual({ day: "2026-07-14", count: 0 });
    expect(s[6]).toEqual({ day: "2026-07-20", count: 0 });
  });
  it("有数据的日期填充计数，缺日补零", () => {
    const s = fillDailySeries([{ day: "2026-07-19", count: 3 }], 3, now);
    expect(s).toEqual([
      { day: "2026-07-18", count: 0 },
      { day: "2026-07-19", count: 3 },
      { day: "2026-07-20", count: 0 },
    ]);
  });
  it("范围外的日期被忽略", () => {
    const s = fillDailySeries([{ day: "2026-01-01", count: 9 }], 2, now);
    expect(s).toEqual([
      { day: "2026-07-19", count: 0 },
      { day: "2026-07-20", count: 0 },
    ]);
  });
});
