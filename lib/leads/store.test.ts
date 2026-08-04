import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));

import { insertLead, listLeads, countLeads, updateLeadFollowUp } from "./store";
import { normalizeTags, normalizeNote, MAX_TAGS, MAX_TAG_LENGTH, MAX_NOTE_LENGTH } from "./follow-up";

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

describe("跟进字段规整", () => {
  it("标签去空白、去空值、去重（忽略大小写）并保留首次出现的写法", () => {
    expect(normalizeTags([" VIP ", "vip", "", "  ", "已报价"])).toEqual(["VIP", "已报价"]);
  });

  it("标签超长截断、超量截断——一条线索挂几十个标签只会让列表没法看", () => {
    expect(normalizeTags(["x".repeat(50)])[0]).toHaveLength(MAX_TAG_LENGTH);
    expect(normalizeTags(Array.from({ length: 30 }, (_, i) => `t${i}`))).toHaveLength(MAX_TAGS);
  });

  it("非数组或非字符串项一律忽略，不抛错", () => {
    expect(normalizeTags("vip")).toEqual([]);
    expect(normalizeTags([1, null, { a: 1 }, "ok"])).toEqual(["ok"]);
  });

  it("备注空串视为清空 → null，而不是存一个空字符串", () => {
    expect(normalizeNote("   ")).toBeNull();
    expect(normalizeNote("")).toBeNull();
    expect(normalizeNote(undefined)).toBeNull();
    expect(normalizeNote("  下周再聊  ")).toBe("下周再聊");
  });

  it("备注超长截断到上限", () => {
    expect(normalizeNote("x".repeat(5000))).toHaveLength(MAX_NOTE_LENGTH);
  });
});

describe("归档与标签筛选", () => {
  const lastSql = () => (queryMock.mock.calls.at(-1) as [string, unknown[]])[0].replace(/\s+/g, " ");

  beforeEach(() => queryMock.mockResolvedValue({ rows: [] }));

  it("默认只看未归档——把已处理的线索混进默认视图，归档就没意义了", async () => {
    await listLeads("u1");
    expect(lastSql()).toContain("l.archived_at IS NULL");
  });

  it("archived=true 时只看已归档（两个视图互斥）", async () => {
    await listLeads("u1", { archived: true });
    expect(lastSql()).toContain("l.archived_at IS NOT NULL");
    expect(lastSql()).not.toContain("l.archived_at IS NULL");
  });

  it("标签筛选走数组包含判断（GIN 索引唯一有效的形式）", async () => {
    await listLeads("u1", { tag: "已报价" });
    const [sql, params] = queryMock.mock.calls.at(-1) as [string, unknown[]];
    expect(sql.replace(/\s+/g, " ")).toContain("l.tags @> $2");
    expect(params[1]).toEqual(["已报价"]);
  });
});

describe("updateLeadFollowUp", () => {
  beforeEach(() => queryMock.mockResolvedValue({ rows: [{ id: "lead-1" }] }));

  it("只更新显式传入的字段——改备注不该顺手清空标签", async () => {
    await updateLeadFollowUp("l1", "u1", { note: "下周再聊" });
    const sql = (queryMock.mock.calls.at(-1) as [string])[0].replace(/\s+/g, " ");
    expect(sql).toContain("note = $3");
    expect(sql).not.toContain("tags =");
    expect(sql).not.toContain("archived_at =");
  });

  it("归档写 NOW()、取消归档写 NULL", async () => {
    await updateLeadFollowUp("l1", "u1", { archived: true });
    expect((queryMock.mock.calls.at(-1) as [string])[0]).toContain("archived_at = NOW()");
    await updateLeadFollowUp("l1", "u1", { archived: false });
    expect((queryMock.mock.calls.at(-1) as [string])[0]).toContain("archived_at = NULL");
  });

  it("按 user 隔离：WHERE 必须同时约束线索 id 与所属用户", async () => {
    await updateLeadFollowUp("l1", "u1", { note: "x" });
    const sql = (queryMock.mock.calls.at(-1) as [string])[0].replace(/\s+/g, " ");
    expect(sql).toContain("l.id = $1");
    expect(sql).toContain("p.user_id = $2");
  });

  it("没有任何可更新字段时不发查询", async () => {
    queryMock.mockClear();
    expect(await updateLeadFollowUp("l1", "u1", {})).toBeNull();
    expect(queryMock).not.toHaveBeenCalled();
  });
});
