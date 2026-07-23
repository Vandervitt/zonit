import { describe, it, expect, vi, beforeEach } from "vitest";

// 隔离真实数据库：聚合逻辑只验证行组装、按用户分组与全零过滤。
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { query } }));

import { computeWeeklyDigests, trendText } from "./digest";

// 注意要用大括号：箭头函数直接返回 mockReset() 会把 mock 自身当成 vitest 的 cleanup
// 钩子，测试收尾时被无参调用，触发实现里的 sql.includes 报错。
beforeEach(() => {
  query.mockReset();
});

function mockRows(pageRows: unknown[], leadRows: unknown[]) {
  // Promise.all 顺序：第一条查页面聚合，第二条查线索聚合。
  query.mockImplementation(async (sql: string) => {
    if (sql.includes("FROM landing_pages")) return { rows: pageRows };
    if (sql.includes("FROM leads")) return { rows: leadRows };
    throw new Error("unexpected sql");
  });
}

describe("computeWeeklyDigests", () => {
  const now = new Date("2026-07-20T01:00:00Z");

  it("按用户分组并合并页面/线索两路聚合", async () => {
    mockRows(
      [
        { user_id: "u1", page_id: "p1", name: "Page A", email: "a@x.com", views: 10, cta_clicks: 3, prev_views: 5, prev_cta_clicks: 1 },
        { user_id: "u1", page_id: "p2", name: "Page B", email: "a@x.com", views: 0, cta_clicks: 0, prev_views: 2, prev_cta_clicks: 0 },
        { user_id: "u2", page_id: "p3", name: "Page C", email: "b@x.com", views: 7, cta_clicks: 2, prev_views: 0, prev_cta_clicks: 0 },
      ],
      [{ page_id: "p1", leads: 4, prev_leads: 2 }],
    );
    const out = await computeWeeklyDigests(now);
    expect(out).toHaveLength(2);
    const u1 = out.find((d) => d.userId === "u1")!;
    expect(u1.email).toBe("a@x.com");
    expect(u1.pages).toHaveLength(2);
    expect(u1.pages[0]).toMatchObject({ pageId: "p1", views: 10, ctaClicks: 3, leads: 4, prevLeads: 2 });
    expect(u1.pages[1]).toMatchObject({ pageId: "p2", leads: 0, prevLeads: 0 });
  });

  it("两周指标全零的用户被跳过（不打扰）", async () => {
    mockRows(
      [
        { user_id: "u1", page_id: "p1", name: "A", email: "a@x.com", views: 0, cta_clicks: 0, prev_views: 0, prev_cta_clicks: 0 },
        { user_id: "u2", page_id: "p2", name: "B", email: "b@x.com", views: 1, cta_clicks: 0, prev_views: 0, prev_cta_clicks: 0 },
      ],
      [],
    );
    const out = await computeWeeklyDigests(now);
    expect(out.map((d) => d.userId)).toEqual(["u2"]);
  });

  it("无任何候选返回空数组", async () => {
    mockRows([], []);
    expect(await computeWeeklyDigests(now)).toEqual([]);
  });

  it("查询窗口参数正确（本周 7 天 / 对比窗口 14 天起点）", async () => {
    mockRows([], []);
    await computeWeeklyDigests(now);
    const pageCall = query.mock.calls.find(([sql]) => (sql as string).includes("FROM landing_pages"))!;
    const [, params] = pageCall as [string, Date[]];
    expect(params[0].toISOString()).toBe("2026-07-13T01:00:00.000Z"); // since = now-7d
    expect(params[1].toISOString()).toBe("2026-07-06T01:00:00.000Z"); // prevSince = now-14d
    expect(params[2].toISOString()).toBe(now.toISOString());
  });
});

describe("trendText", () => {
  it("上周为 0：本周有量记「新增」，无量记「—」", () => {
    expect(trendText(5, 0)).toBe("新增");
    expect(trendText(0, 0)).toBe("—");
  });
  it("正常环比：涨跌与持平", () => {
    expect(trendText(15, 10)).toBe("↑50%");
    expect(trendText(5, 10)).toBe("↓50%");
    expect(trendText(10, 10)).toBe("持平");
  });
});
