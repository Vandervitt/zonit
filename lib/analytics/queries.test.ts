import { describe, it, expect } from "vitest";
import { buildSeries, summarize } from "./queries";

describe("analytics 整形", () => {
  it("summarize 计算 ctr（clicks/views，无 views 时为 0）", () => {
    expect(summarize(100, 5)).toEqual({ views: 100, clicks: 5, ctr: 0.05 });
    expect(summarize(0, 0)).toEqual({ views: 0, clicks: 0, ctr: 0 });
  });
  it("buildSeries 按天补零并保序", () => {
    const rows = [{ date: "2026-06-20", views: 10, clicks: 2 }];
    const s = buildSeries(rows, ["2026-06-19", "2026-06-20"]);
    expect(s).toEqual([
      { date: "2026-06-19", views: 0, clicks: 0 },
      { date: "2026-06-20", views: 10, clicks: 2 },
    ]);
  });
});
