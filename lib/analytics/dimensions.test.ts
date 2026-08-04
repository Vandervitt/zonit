import { describe, it, expect } from "vitest";
import {
  ATTRIBUTION_DIMENSIONS, DEFAULT_DIMENSION, UNLABELED,
  isAttributionDimension, mergeAttribution,
} from "./dimensions";

describe("归因维度白名单", () => {
  it("只认白名单里的维度——它会被拼进 SQL 列名", () => {
    expect(isAttributionDimension("campaign")).toBe(true);
    expect(isAttributionDimension("utm_campaign")).toBe(false);
    expect(isAttributionDimension("id; DROP TABLE leads")).toBe(false);
    expect(isAttributionDimension(undefined)).toBe(false);
  });

  it("映射到的列名全部是 utm_ 前缀的真实列", () => {
    for (const col of Object.values(ATTRIBUTION_DIMENSIONS)) {
      expect(col).toMatch(/^utm_[a-z]+$/);
    }
  });

  it("默认维度是广告系列——投放侧最常问「哪条广告带来的线索」", () => {
    expect(DEFAULT_DIMENSION).toBe("campaign");
  });
});

describe("mergeAttribution", () => {
  it("把曝光侧与线索侧按取值合并，并算出线索转化率", () => {
    const rows = mergeAttribution(
      [{ value: "summer_sale", views: 200, clicks: 40 }],
      [{ value: "summer_sale", leads: 10 }],
    );
    expect(rows).toEqual([{ value: "summer_sale", views: 200, clicks: 40, leads: 10, cvr: 0.05 }]);
  });

  it("按线索数降序——曝光多但没线索的广告不该排在前面", () => {
    const rows = mergeAttribution(
      [
        { value: "big_reach", views: 10_000, clicks: 100 },
        { value: "small_but_works", views: 300, clicks: 60 },
      ],
      [{ value: "small_but_works", leads: 25 }],
    );
    expect(rows.map((r) => r.value)).toEqual(["small_but_works", "big_reach"]);
  });

  it("只在一侧出现的取值也要保留：有线索无曝光记录时不能丢", () => {
    const rows = mergeAttribution([], [{ value: UNLABELED, leads: 3 }]);
    expect(rows).toEqual([{ value: UNLABELED, views: 0, clicks: 0, leads: 3, cvr: 0 }]);
  });

  it("曝光为 0 时转化率记 0 而不是 NaN", () => {
    expect(mergeAttribution([{ value: "x", views: 0, clicks: 0 }], [{ value: "x", leads: 2 }])[0].cvr).toBe(0);
  });

  it("超出上限只保留前 N 条（按排序后截断）", () => {
    const events = Array.from({ length: 30 }, (_, i) => ({ value: `c${i}`, views: i, clicks: 0 }));
    expect(mergeAttribution(events, [], 20)).toHaveLength(20);
  });
});
