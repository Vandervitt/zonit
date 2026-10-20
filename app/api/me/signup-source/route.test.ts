import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const recordMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/attribution/signup-source-db", () => ({
  recordSignupSource: (...a: unknown[]) => recordMock(...a),
}));

import { POST } from "./route";

const SOURCE = { landing: "/zh/templates/b2b-sourcing", referrer: null, utm: { utm_source: "xhs" }, at: "2026-10-20T08:00:00.000Z" };
const req = (body: unknown) =>
  new Request("http://x/api/me/signup-source", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as Parameters<typeof POST>[0];

beforeEach(() => {
  authMock.mockReset();
  recordMock.mockReset();
});

describe("POST /api/me/signup-source", () => {
  it("未登录 401，不写库", async () => {
    authMock.mockResolvedValue(null);
    const res = await POST(req(SOURCE));
    expect(res.status).toBe(401);
    expect(recordMock).not.toHaveBeenCalled();
  });

  it("只写当前会话用户，且写入的是校验后的数据", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    recordMock.mockResolvedValue(true);
    const res = await POST(req({ ...SOURCE, userId: "someone-else", email: "x@y.z" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: true });
    expect(recordMock).toHaveBeenCalledWith("u1", SOURCE);
  });

  it("已有来源或超出窗口：200 recorded=false（客户端据此停止重报）", async () => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    recordMock.mockResolvedValue(false);
    const res = await POST(req(SOURCE));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ recorded: false });
  });

  it.each([
    ["非 JSON", "not json"],
    ["形状不对", { landing: "https://evil.com", at: "x" }],
  ])("%s → 400，不写库", async (_l, body) => {
    authMock.mockResolvedValue({ user: { id: "u1" } });
    const res = await POST(req(body));
    expect(res.status).toBe(400);
    expect(recordMock).not.toHaveBeenCalled();
  });
});
