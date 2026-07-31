import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));

import { bucketKey, allowRequest, pruneRateLimitHits } from "./rate-limit-db";

beforeEach(() => {
  vi.clearAllMocks();
  queryMock.mockResolvedValue({ rows: [{ n: 1 }] });
});

describe("bucketKey", () => {
  it("不含原始 IP（访客 PII 不入库）", () => {
    const key = bucketKey("leads", "203.0.113.9");
    expect(key).not.toContain("203.0.113.9");
    expect(key).toMatch(/^leads:[0-9a-f]{32}$/);
  });

  it("同 IP 同用途稳定，换 IP 或换用途即不同", () => {
    expect(bucketKey("leads", "1.1.1.1")).toBe(bucketKey("leads", "1.1.1.1"));
    expect(bucketKey("leads", "1.1.1.1")).not.toBe(bucketKey("leads", "2.2.2.2"));
    expect(bucketKey("leads", "1.1.1.1")).not.toBe(bucketKey("track", "1.1.1.1"));
  });
});

describe("allowRequest", () => {
  it("窗口内计数未超上限 → 放行", async () => {
    queryMock.mockResolvedValue({ rows: [{ n: 3 }] });
    expect(await allowRequest("leads:x", { windowMs: 60_000, max: 5 })).toBe(true);
  });

  it("计数达到上限 → 拒绝", async () => {
    queryMock.mockResolvedValue({ rows: [{ n: 6 }] });
    expect(await allowRequest("leads:x", { windowMs: 60_000, max: 5 })).toBe(false);
  });

  it("一次往返完成「记一笔 + 数窗口内条数」", async () => {
    await allowRequest("leads:x", { windowMs: 60_000, max: 5 });
    expect(queryMock).toHaveBeenCalledOnce();
    const [sql, params] = queryMock.mock.calls[0];
    expect(sql).toContain("INSERT INTO rate_limit_hits");
    expect(params).toEqual(["leads:x", 60_000]);
  });

  it("DB 故障 → 放行而不是拦截：限频不能成为压死留资的那根稻草", async () => {
    queryMock.mockRejectedValue(new Error("pool exhausted"));
    expect(await allowRequest("leads:x", { windowMs: 60_000, max: 5 })).toBe(true);
  });
});

describe("pruneRateLimitHits", () => {
  it("清理过期计数行，返回清理条数", async () => {
    queryMock.mockResolvedValue({ rowCount: 42 });
    expect(await pruneRateLimitHits()).toBe(42);
    expect(queryMock.mock.calls[0][0]).toContain("DELETE FROM rate_limit_hits");
  });
});
