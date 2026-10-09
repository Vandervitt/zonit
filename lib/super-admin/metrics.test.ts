import { describe, it, expect } from "vitest";
import { parseStatsRange, ratePercent, rangeSinceSql } from "./metrics";

describe("parseStatsRange", () => {
  it("只接受白名单值，其余回落 30 天", () => {
    expect(parseStatsRange("90")).toBe("90");
    expect(parseStatsRange("all")).toBe("all");
    expect(parseStatsRange("7; DROP TABLE users")).toBe("30");
    expect(parseStatsRange(undefined)).toBe("30");
    expect(parseStatsRange(["90"])).toBe("30");
  });
});

describe("rangeSinceSql", () => {
  it("全部时段不加时间条件", () => {
    expect(rangeSinceSql("all", "u.created_at")).toBe("TRUE");
    expect(rangeSinceSql("90", "u.created_at")).toBe("u.created_at > NOW() - INTERVAL '90 days'");
  });
});

describe("ratePercent", () => {
  it("向下截断而非四舍五入", () => {
    expect(ratePercent(2, 3, 1)).toBe(66.6); // 66.666… 四舍五入会得 66.7
    expect(ratePercent(1, 3, 0)).toBe(33);
    expect(ratePercent(999, 1000, 0)).toBe(99); // 四舍五入会得 100
  });
  it("分母为 0 返回 null（无样本不是 0%）", () => {
    expect(ratePercent(0, 0, 1)).toBeNull();
  });
});

describe("weekOverWeek", () => {
  it("环比变化百分比向下截断；上周为 0 时返回 null（无法计算，不是无穷大）", async () => {
    const { weekOverWeek } = await import("./metrics");
    expect(weekOverWeek(3, 2)).toBe(50);
    expect(weekOverWeek(2, 3)).toBe(-33); // -33.33… 向零截断
    expect(weekOverWeek(5, 0)).toBeNull();
    expect(weekOverWeek(0, 0)).toBeNull();
  });
});
