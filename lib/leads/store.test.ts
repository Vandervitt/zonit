import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));

import { insertLead, listLeads, countLeads } from "./store";

const pgError = (code: string) => Object.assign(new Error(`pg ${code}`), { code });
const PAGE = "11111111-1111-4111-8111-111111111111";
const insert = () => insertLead(PAGE, { name: "Ann" } as never, { channel: "form" });

beforeEach(() => {
  vi.clearAllMocks();
  queryMock.mockResolvedValue({ rows: [{ id: "lead-1" }] });
});

describe("insertLead", () => {
  it("首次成功不重试，并返回线索 id（通知结果要回写到它上面）", async () => {
    expect(await insert()).toBe("lead-1");
    expect(queryMock).toHaveBeenCalledOnce();
  });

  it("瞬时故障重试一次即成功", async () => {
    queryMock.mockRejectedValueOnce(new Error("Connection terminated unexpectedly"));
    await insert();
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("重试仍失败 → 抛给调用方走兜底", async () => {
    queryMock.mockRejectedValue(pgError("57P01"));
    await expect(insert()).rejects.toMatchObject({ code: "57P01" });
    expect(queryMock).toHaveBeenCalledTimes(2);
  });

  it("坏 pageId 立即抛出，不浪费一次重试", async () => {
    queryMock.mockRejectedValue(pgError("23503"));
    await expect(insert()).rejects.toMatchObject({ code: "23503" });
    expect(queryMock).toHaveBeenCalledOnce();
  });
});

describe("listLeads 筛选与分页", () => {
  /** 取最近一次查询的 (sql, params)。 */
  const lastCall = () => {
    const [sql, params] = queryMock.mock.calls.at(-1) as [string, unknown[]];
    return { sql: sql.replace(/\s+/g, " "), params };
  };

  beforeEach(() => queryMock.mockResolvedValue({ rows: [] }));

  it("不传 limit 时不分页——CSV 导出要的是全量", async () => {
    await listLeads("u1");
    const { sql, params } = lastCall();
    expect(sql).not.toContain("LIMIT");
    expect(params).toEqual(["u1"]);
  });

  it("LIMIT / OFFSET 的占位符排在筛选参数之后，顺序不能错位", async () => {
    await listLeads("u1", { pageId: "p1", unreadOnly: true, limit: 50, offset: 100 });
    const { sql, params } = lastCall();
    expect(sql).toContain("l.page_id = $2");
    expect(sql).toContain("l.is_read = false");
    expect(sql).toContain("LIMIT $3 OFFSET $4");
    expect(params).toEqual(["u1", "p1", 50, 100]);
  });

  it("offset 为 0 时不拼 OFFSET（等价且少一个参数）", async () => {
    await listLeads("u1", { limit: 50, offset: 0 });
    const { sql, params } = lastCall();
    expect(sql).toContain("LIMIT $2");
    expect(sql).not.toContain("OFFSET");
    expect(params).toEqual(["u1", 50]);
  });

  it("countLeads 与 listLeads 用同一套筛选——总数和页数必须对得上", async () => {
    queryMock.mockResolvedValue({ rows: [{ n: 7 }] });
    const n = await countLeads("u1", { pageId: "p1", unreadOnly: true });
    const { sql, params } = lastCall();
    expect(n).toBe(7);
    expect(sql).toContain("l.page_id = $2");
    expect(sql).toContain("l.is_read = false");
    // 计数不带分页，否则数出来的永远是一页的量
    expect(sql).not.toContain("LIMIT");
    expect(params).toEqual(["u1", "p1"]);
  });
});
