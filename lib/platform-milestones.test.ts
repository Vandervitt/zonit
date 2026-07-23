import { describe, it, expect, vi, beforeEach } from "vitest";

// 隔离真实数据库：里程碑写入/聚合只验证 SQL 语义与容错行为。
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { query } }));

import {
  recordMilestone,
  recordFirstLeadMilestone,
  getFunnelStats,
  MILESTONE_EVENTS,
} from "./platform-milestones";

beforeEach(() => query.mockReset());

describe("recordMilestone", () => {
  it("以 ON CONFLICT DO NOTHING 写入（首次达成幂等语义）", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await recordMilestone("u1", "page_published");
    expect(query).toHaveBeenCalledTimes(1);
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("ON CONFLICT DO NOTHING");
    expect(sql).toContain("platform_milestones");
    expect(params).toEqual(["u1", "page_published"]);
  });

  it("数据库失败不抛错（绝不影响主链路）", async () => {
    query.mockRejectedValueOnce(new Error("connection refused"));
    await expect(recordMilestone("u1", "signup")).resolves.toBeUndefined();
  });
});

describe("recordFirstLeadMilestone", () => {
  it("按 pageId 反查页主人写入 first_lead", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    await recordFirstLeadMilestone("p1");
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("SELECT user_id, 'first_lead' FROM landing_pages");
    expect(sql).toContain("ON CONFLICT DO NOTHING");
    expect(params).toEqual(["p1"]);
  });

  it("数据库失败不抛错", async () => {
    query.mockRejectedValueOnce(new Error("boom"));
    await expect(recordFirstLeadMilestone("p1")).resolves.toBeUndefined();
  });
});

describe("listUserMilestones", () => {
  it("返回该用户已达成事件，过滤未知脏值", async () => {
    query.mockResolvedValueOnce({ rows: [{ event: "signup" }, { event: "bogus" }, { event: "page_created" }] });
    const events = await import("./platform-milestones").then((m) => m.listUserMilestones("u1"));
    expect(events).toEqual(["signup", "page_created"]);
    expect(query.mock.calls[0][1]).toEqual(["u1"]);
  });
});

describe("getFunnelStats", () => {
  it("聚合各里程碑人数，缺失事件补 0，中位耗时透传为数字", async () => {
    query
      .mockResolvedValueOnce({
        rows: [
          { event: "signup", n: 10 },
          { event: "page_created", n: 6 },
          { event: "page_published", n: 2 },
        ],
      })
      .mockResolvedValueOnce({ rows: [{ h: "26.5" }] });

    const stats = await getFunnelStats();
    expect(stats.counts).toEqual({
      signup: 10,
      page_created: 6,
      domain_verified: 0,
      page_published: 2,
      first_lead: 0,
    });
    expect(stats.medianHoursToPublish).toBe(26.5);
  });

  it("无任何达成用户时全 0 且中位耗时为 null", async () => {
    query.mockResolvedValueOnce({ rows: [] }).mockResolvedValueOnce({ rows: [{ h: null }] });
    const stats = await getFunnelStats();
    for (const e of MILESTONE_EVENTS) expect(stats.counts[e]).toBe(0);
    expect(stats.medianHoursToPublish).toBeNull();
  });

  it("忽略库中未知事件值（防脏数据破坏聚合）", async () => {
    query
      .mockResolvedValueOnce({ rows: [{ event: "bogus", n: 3 }, { event: "signup", n: 1 }] })
      .mockResolvedValueOnce({ rows: [] });
    const stats = await getFunnelStats();
    expect(stats.counts.signup).toBe(1);
    expect(Object.keys(stats.counts)).toEqual([...MILESTONE_EVENTS]);
  });
});
