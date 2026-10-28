import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const createCheckoutMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/billing/provider", () => ({
  getActiveProvider: async () => ({
    isConfigured: () => true,
    createCheckout: (...a: unknown[]) => createCheckoutMock(...a),
  }),
}));

import { POST } from "./route";
import { PlanProductNotConfiguredError } from "@/lib/billing/types";

const req = (body: unknown) =>
  new Request("http://x/api/billing/checkout", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue({ user: { id: "u1", email: "a@b.c" } });
  createCheckoutMock.mockResolvedValue("https://pay/x");
});

describe("POST /api/billing/checkout", () => {
  it("按档位 + 周期建结账会话（缺省月付）", async () => {
    expect((await POST(req({ planId: "pro" }))).status).toBe(200);
    expect(createCheckoutMock).toHaveBeenCalledWith(expect.objectContaining({ planId: "pro", interval: "month" }));
    await POST(req({ planId: "agency", interval: "year" }));
    expect(createCheckoutMock).toHaveBeenLastCalledWith(expect.objectContaining({ planId: "agency", interval: "year" }));
  });

  it("free / 已下架的 starter / 非法周期 → 400，不建会话", async () => {
    for (const body of [{ planId: "free" }, { planId: "starter" }, { planId: "pro", interval: "week" }, {}]) {
      expect((await POST(req(body))).status).toBe(400);
    }
    expect(createCheckoutMock).not.toHaveBeenCalled();
  });

  it("渠道没有该周期的产品 → 503 业务码", async () => {
    createCheckoutMock.mockRejectedValue(new PlanProductNotConfiguredError("no yearly"));
    const res = await POST(req({ planId: "pro", interval: "year" }));
    expect(res.status).toBe(503);
    expect(await res.json()).toEqual({ error: "plan_product_not_configured" });
  });
});
