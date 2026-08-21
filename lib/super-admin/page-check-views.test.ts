import { describe, it, expect, vi, beforeEach } from "vitest";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { query } }));

import { listOpenedLinks, getOutreachSummary } from "./page-check-views";

beforeEach(() => {
  query.mockReset();
});

function emptyRows() {
  query.mockResolvedValue({ rows: [] });
}

describe("listOpenedLinks", () => {
  it("只列出有非创建者访问的链接", async () => {
    // 没有这条过滤，表里会被公开工具的自助使用淹没——那类记录创建和查看是同一个人。
    emptyRows();
    await listOpenedLinks();
    for (const [sql] of query.mock.calls) {
      expect(sql).toContain("HAVING");
      expect(sql).toContain("NOT v.is_bot AND NOT v.is_creator");
    }
  });

  it("人类计数排除机器人与创建者，机器人单独计数", async () => {
    emptyRows();
    await listOpenedLinks();
    const [sql] = query.mock.calls[0];
    expect(sql).toContain("FILTER (WHERE NOT v.is_bot AND NOT v.is_creator)");
    expect(sql).toContain("FILTER (WHERE v.is_bot)");
  });

  it("访问计数必须 DISTINCT，否则批次的 items JOIN 会把次数翻 N 倍", async () => {
    // 真实缺陷回归：对比批次要 JOIN batch_items 才能数出页数，
    // 这个 JOIN 会把每条浏览记录复制成 N 行（N = 批次内页数）。
    // 本地走查时 1 次访问被显示成 3 次，就是这个原因。
    emptyRows();
    await listOpenedLinks();
    for (const [sql] of query.mock.calls) {
      expect(sql).toContain("COUNT(DISTINCT v.id)");
      expect(sql).not.toMatch(/COUNT\(v\.id\)\s+FILTER/);
    }
  });

  it("合并单页与对比两类链接，按最近访问倒序", async () => {
    const base = {
      created_at: new Date("2026-08-20T00:00:00Z"),
      expires_at: new Date("2026-09-19T00:00:00Z"),
      human_views: 1,
      unique_humans: 1,
      bot_views: 0,
      first_human_at: null,
    };
    query
      .mockResolvedValueOnce({
        rows: [
          {
            ...base,
            id: "rep1",
            input_url: "https://a.com",
            last_human_at: new Date("2026-08-21T09:00:00Z"),
          },
        ],
      })
      .mockResolvedValueOnce({
        rows: [
          {
            ...base,
            id: "bat1",
            input_url: "https://b.com",
            page_count: 3,
            last_human_at: new Date("2026-08-21T12:00:00Z"),
          },
        ],
      });

    const rows = await listOpenedLinks();
    expect(rows.map((r) => r.kind)).toEqual(["batch", "report"]);
    expect(rows[0].pageCount).toBe(3);
    expect(rows[1].pageCount).toBe(1);
    // key 必须跨两类唯一，否则 antd Table 行会互相覆盖。
    expect(new Set(rows.map((r) => r.key)).size).toBe(2);
  });

  it("limit 同时约束两条查询与合并结果", async () => {
    emptyRows();
    await listOpenedLinks(5);
    for (const [, params] of query.mock.calls) {
      expect(params).toEqual([5]);
    }
  });
});

describe("getOutreachSummary", () => {
  it("空表返回全 0 而不是 undefined", async () => {
    query.mockResolvedValueOnce({ rows: [] });
    expect(await getOutreachSummary()).toEqual({
      trackedLinks: 0,
      openedLinks: 0,
      botViews: 0,
    });
  });

  it("按链接去重统计，不是按访问次数", async () => {
    // 同一条链接被打开 10 次算 1 条被打开的链接；混淆这两者会把打开数虚高一个量级。
    query.mockResolvedValueOnce({
      rows: [{ tracked_links: 4, opened_links: 2, bot_views: 9 }],
    });
    const summary = await getOutreachSummary();
    expect(summary).toEqual({ trackedLinks: 4, openedLinks: 2, botViews: 9 });
    const [sql] = query.mock.calls[0];
    expect(sql).toContain("COUNT(DISTINCT COALESCE(report_id, batch_id))");
  });
});
