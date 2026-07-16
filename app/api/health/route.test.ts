import { describe, it, expect, vi, beforeEach } from "vitest";

// 用 mock 隔离真实数据库：健康检查只关心「能否连通」，用桩函数模拟成功/失败。
// vi.mock 会被提升到文件顶部，故 query 必须用 vi.hoisted 一并提升。
const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/db", () => ({ default: { query } }));

import { GET } from "./route";

describe("GET /api/health", () => {
  beforeEach(() => query.mockReset());

  it("DB 可达时返回 200 且标记 db up", async () => {
    query.mockResolvedValueOnce({ rows: [{ "?column?": 1 }] });
    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.status).toBe("ok");
    expect(body.db).toBe("up");
    expect(res.headers.get("cache-control")).toContain("no-store");
  });

  it("DB 查询失败时返回 503 且标记 db down", async () => {
    query.mockRejectedValueOnce(new Error("connection refused"));
    const res = await GET();
    expect(res.status).toBe(503);
    const body = await res.json();
    expect(body.status).toBe("degraded");
    expect(body.db).toBe("down");
  });
});
