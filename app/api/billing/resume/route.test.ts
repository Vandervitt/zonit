import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const queryMock = vi.fn();
const resumeMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));
vi.mock("@/lib/billing/provider", () => ({
  getProvider: () => ({ resume: (...a: unknown[]) => resumeMock(...a) }),
}));

import { POST } from "./route";

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: "u1" } });
  queryMock.mockResolvedValue({ rows: [{ billing_provider: "dodo", billing_subscription_id: "sub_1" }] });
  resumeMock.mockResolvedValue(undefined);
});

describe("POST /api/billing/resume", () => {
  it("未登录 → 401", async () => {
    authMock.mockResolvedValue(null);
    expect((await POST()).status).toBe(401);
    expect(resumeMock).not.toHaveBeenCalled();
  });

  it("无有效订阅 → 404", async () => {
    queryMock.mockResolvedValue({ rows: [{}] });
    expect((await POST()).status).toBe(404);
  });

  it("正常恢复 → 200 并透传 subscriptionId", async () => {
    const res = await POST();
    expect(res.status).toBe(200);
    expect(resumeMock).toHaveBeenCalledWith("sub_1");
  });

  it("渠道抛错（如 Creem 不支持）→ 500 带信息", async () => {
    resumeMock.mockRejectedValue(new Error("Creem 渠道暂不支持在线恢复订阅"));
    const res = await POST();
    expect(res.status).toBe(500);
  });
});
