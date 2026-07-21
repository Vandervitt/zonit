import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const queryMock = vi.fn();
const changePlanMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));
vi.mock("@/lib/billing/provider", () => ({
  getProvider: () => ({ changePlan: (...a: unknown[]) => changePlanMock(...a) }),
}));

import { POST } from "./route";

const USER = { user: { id: "u1", email: "a@b.c" } };
const req = (body: unknown) =>
  new Request("http://x/api/billing/change-plan", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(USER);
  queryMock.mockResolvedValue({ rows: [{ billing_provider: "dodo", billing_subscription_id: "sub_1" }] });
  changePlanMock.mockResolvedValue(undefined);
});

describe("POST /api/billing/change-plan", () => {
  it("未登录 → 401", async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(req({ planId: "pro" }))).status).toBe(401);
    expect(changePlanMock).not.toHaveBeenCalled();
  });

  it("非法档位（free/未知）→ 400", async () => {
    expect((await POST(req({ planId: "free" }))).status).toBe(400);
    expect((await POST(req({ planId: "vip" }))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    expect(changePlanMock).not.toHaveBeenCalled();
  });

  it("无有效订阅 → 404 且返回业务码 no_active_subscription", async () => {
    queryMock.mockResolvedValue({ rows: [{ billing_provider: null, billing_subscription_id: null }] });
    const res = await POST(req({ planId: "pro" }));
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ error: "no_active_subscription" });
    expect(changePlanMock).not.toHaveBeenCalled();
  });

  it("正常换档 → 200 并把 subscriptionId+planId 透传给渠道", async () => {
    const res = await POST(req({ planId: "starter" }));
    expect(res.status).toBe(200);
    expect(changePlanMock).toHaveBeenCalledWith("sub_1", "starter");
  });

  it("渠道抛错 → 500", async () => {
    changePlanMock.mockRejectedValue(new Error("dodo 402: payment failed"));
    expect((await POST(req({ planId: "agency" }))).status).toBe(500);
  });

  it("订阅处于周期末取消（SDK err.status=409）→ 业务 409 subscription_cancel_scheduled", async () => {
    const err = Object.assign(new Error("409 Subscription scheduled for cancellation"), { status: 409 });
    changePlanMock.mockRejectedValue(err);
    const res = await POST(req({ planId: "pro" }));
    expect(res.status).toBe(409);
    expect(await res.json()).toEqual({ error: "subscription_cancel_scheduled" });
  });

  it("仅凭错误文案也能识别取消排期 → 409", async () => {
    changePlanMock.mockRejectedValue(new Error("Subscription scheduled for cancellation"));
    expect((await POST(req({ planId: "pro" }))).status).toBe(409);
  });
});
