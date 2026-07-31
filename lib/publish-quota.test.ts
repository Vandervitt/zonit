// 降档宽限对账。
//
// 关键约束：不存在可埋点的「降档时刻」—— getUserPlan 返回的是读时计算的
// max(plan, comp_plan)，而 comp_plan 过期是纯时间驱动的，过期那一刻没有任何
// 代码运行。故整个流转必须由「当前是否超额」推导，且每日重跑幂等。
import { describe, it, expect } from "vitest";
import { GRACE_DAYS, reconcilePublishQuota, type QuotaPage } from "./publish-quota";

const NOW = new Date("2026-08-01T01:00:00Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

/** 按发布时间倒序造页：p0 最早发布。 */
const pages = (n: number, rootIndex: number | null = null): QuotaPage[] =>
  Array.from({ length: n }, (_, i) => ({
    id: `p${i}`,
    publishedAt: daysAgo(100 - i), // i 越大越新
    isRoot: i === rootIndex,
  }));

const run = (over: number | null, list: QuotaPage[], limit: number) =>
  reconcilePublishQuota({
    limit,
    pages: list,
    overQuotaSince: over === null ? null : daysAgo(over),
    now: NOW,
  });

describe("未超额", () => {
  it("页数等于额度 → 无动作", () => {
    expect(run(null, pages(5), 5).kind).toBe("none");
  });

  it("页数少于额度 → 无动作", () => {
    expect(run(null, pages(2), 5).kind).toBe("none");
  });

  it("宽限期内客户自行下线到达标 → 解除宽限", () => {
    expect(run(3, pages(5), 5).kind).toBe("clear_grace");
  });

  it("Agency 无限额度永不超额", () => {
    expect(run(null, pages(50), Infinity).kind).toBe("none");
  });

  it("没有已发布页 → 无动作（不因额度为 0 而误判）", () => {
    expect(run(null, [], 0).kind).toBe("none");
  });
});

describe("超额流转", () => {
  it("首次发现超额 → 起算宽限", () => {
    expect(run(null, pages(8), 5).kind).toBe("start_grace");
  });

  it("宽限期内且未临近到期 → 无动作（不重复发信）", () => {
    expect(run(2, pages(8), 5).kind).toBe("none");
  });

  it("到期前一天 → 发提醒", () => {
    expect(run(GRACE_DAYS - 1, pages(8), 5).kind).toBe("remind");
  });

  it("到期 → 执行下线", () => {
    expect(run(GRACE_DAYS, pages(8), 5).kind).toBe("enforce");
  });

  it("超期很久 → 仍执行下线（cron 漏跑后能补上）", () => {
    expect(run(GRACE_DAYS + 30, pages(8), 5).kind).toBe("enforce");
  });
});

describe("下线选择：保留哪几张", () => {
  it("只下线超出的部分，数量正确", () => {
    const r = run(GRACE_DAYS, pages(8), 5);
    expect(r.kind === "enforce" && r.unpublishIds.length).toBe(3);
  });

  it("保留最早发布的（新页先下线）", () => {
    const r = run(GRACE_DAYS, pages(8), 5);
    // p0..p4 最早 → 保留；p5/p6/p7 最新 → 下线
    expect(r.kind === "enforce" && r.unpublishIds.sort()).toEqual(["p5", "p6", "p7"]);
  });

  it("根路径页优先保留，即使它是最新发布的", () => {
    // 8 张页，最新的那张（p7）在根路径
    const r = run(GRACE_DAYS, pages(8, 7), 5);
    expect(r.kind === "enforce" && r.unpublishIds).not.toContain("p7");
    // 保留 p7 后只剩 4 个名额给 p0..p6 中最早的四张
    expect(r.kind === "enforce" && r.unpublishIds.sort()).toEqual(["p4", "p5", "p6"]);
  });

  it("额度为 0 → 全部下线", () => {
    const r = run(GRACE_DAYS, pages(3), 0);
    expect(r.kind === "enforce" && r.unpublishIds.sort()).toEqual(["p0", "p1", "p2"]);
  });

  it("publishedAt 缺失的页排在最后（当作最新）", () => {
    const list: QuotaPage[] = [
      { id: "old", publishedAt: daysAgo(50), isRoot: false },
      { id: "nulldate", publishedAt: null, isRoot: false },
      { id: "newer", publishedAt: daysAgo(10), isRoot: false },
    ];
    const r = reconcilePublishQuota({
      limit: 2, pages: list, overQuotaSince: daysAgo(GRACE_DAYS), now: NOW,
    });
    expect(r.kind === "enforce" && r.unpublishIds).toEqual(["nulldate"]);
  });
});

describe("幂等与边界", () => {
  it("同一输入重复执行结果一致", () => {
    const a = run(GRACE_DAYS, pages(8), 5);
    const b = run(GRACE_DAYS, pages(8), 5);
    expect(a).toEqual(b);
  });

  it("下线后再次对账（页数已达标）→ 解除宽限而非重复下线", () => {
    expect(run(GRACE_DAYS, pages(5), 5).kind).toBe("clear_grace");
  });

  it("超额但恰好等于额度+1 → 只下线 1 张", () => {
    const r = run(GRACE_DAYS, pages(6), 5);
    expect(r.kind === "enforce" && r.unpublishIds.length).toBe(1);
  });
});
