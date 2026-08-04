import { describe, it, expect } from "vitest";
import { resolveRange, previousRange, changeRate, datesInRange, MAX_RANGE_DAYS } from "./range";

// 固定「现在」，避免用例随真实日期漂移。
const NOW = new Date("2026-08-04T13:22:00.000Z");

describe("resolveRange 预设区间", () => {
  it("含今天：右端取次日零点，今天的数据完整计入", () => {
    const r = resolveRange({ days: 7 }, NOW);
    expect(r.to).toBe("2026-08-05T00:00:00.000Z");
    expect(r.from).toBe("2026-07-29T00:00:00.000Z");
    expect(r.days).toBe(7);
  });

  it("非预设天数回落 30，不报错——报表页不该被一个坏 query 参数整页打挂", () => {
    expect(resolveRange({ days: 5 }, NOW).days).toBe(30);
    expect(resolveRange({ days: "abc" }, NOW).days).toBe(30);
    expect(resolveRange({}, NOW).days).toBe(30);
  });
});

describe("resolveRange 自定义区间", () => {
  it("to 含当天：右端取次日零点", () => {
    const r = resolveRange({ from: "2026-07-01", to: "2026-07-31" }, NOW);
    expect(r.from).toBe("2026-07-01T00:00:00.000Z");
    expect(r.to).toBe("2026-08-01T00:00:00.000Z");
    expect(r.days).toBe(31);
  });

  it("自定义优先于 days", () => {
    expect(resolveRange({ days: 7, from: "2026-07-01", to: "2026-07-02" }, NOW).days).toBe(2);
  });

  it("颠倒、格式错、带时间的输入一律回落预设，不产出歧义口径", () => {
    expect(resolveRange({ from: "2026-07-31", to: "2026-07-01" }, NOW).days).toBe(30);
    expect(resolveRange({ from: "07/01/2026", to: "07/31/2026" }, NOW).days).toBe(30);
    expect(resolveRange({ from: "2026-07-01T10:00:00Z", to: "2026-07-31" }, NOW).days).toBe(30);
  });

  it("超过上限回落预设，不允许一次拉穿全表", () => {
    expect(resolveRange({ from: "2020-01-01", to: "2026-08-01" }, NOW).days).toBe(30);
    expect(MAX_RANGE_DAYS).toBe(366);
  });

  it("右端越过今天时夹到明天零点，而不是报错", () => {
    const r = resolveRange({ from: "2026-08-01", to: "2026-12-31" }, NOW);
    expect(r.to).toBe("2026-08-05T00:00:00.000Z");
    expect(r.days).toBe(4);
  });
});

describe("previousRange", () => {
  it("紧邻且等长：上一段的右端正好是本段的左端（半开区间不重不漏）", () => {
    const cur = resolveRange({ days: 7 }, NOW);
    const prev = previousRange(cur);
    expect(prev.to).toBe(cur.from);
    expect(prev.from).toBe("2026-07-22T00:00:00.000Z");
  });

  it("自定义区间同样取等长上一段", () => {
    const cur = resolveRange({ from: "2026-07-11", to: "2026-07-20" }, NOW);
    const prev = previousRange(cur);
    expect(prev.from).toBe("2026-07-01T00:00:00.000Z");
    expect(prev.to).toBe("2026-07-11T00:00:00.000Z");
  });
});

describe("changeRate", () => {
  it("常规涨跌", () => {
    expect(changeRate(120, 100)).toBeCloseTo(0.2);
    expect(changeRate(80, 100)).toBeCloseTo(-0.2);
    expect(changeRate(100, 100)).toBe(0);
  });

  it("上一段为 0 时返回 null——「从 0 到 5」不是「增长 100%」", () => {
    expect(changeRate(5, 0)).toBeNull();
    expect(changeRate(0, 0)).toBeNull();
  });
});

describe("datesInRange", () => {
  it("按天铺满且不含右端（半开区间）", () => {
    const dates = datesInRange(resolveRange({ from: "2026-07-01", to: "2026-07-03" }, NOW));
    expect(dates).toEqual(["2026-07-01", "2026-07-02", "2026-07-03"]);
  });
});
