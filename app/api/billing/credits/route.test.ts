import { describe, it, expect, vi, beforeEach } from "vitest";

const authMock = vi.fn();
const isConfiguredMock = vi.fn();
const createCreditCheckoutMock = vi.fn();

vi.mock("@/auth", () => ({ auth: () => authMock() }));
vi.mock("@/lib/billing/provider", () => ({
  getActiveProvider: () =>
    Promise.resolve({
      isConfigured: () => isConfiguredMock(),
      createCreditCheckout: (...a: unknown[]) => createCreditCheckoutMock(...a),
    }),
}));

import { POST } from "./route";

const USER = { user: { id: "u1", email: "a@b.c" } };
const req = (body: unknown) =>
  new Request("http://x/api/billing/credits", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  vi.clearAllMocks();
  authMock.mockResolvedValue(USER);
  isConfiguredMock.mockReturnValue(true);
  createCreditCheckoutMock.mockResolvedValue("https://pay.example/checkout");
});

describe("POST /api/billing/credits", () => {
  it("未登录 → 401", async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(req({ credits: 50 }))).status).toBe(401);
    expect(createCreditCheckoutMock).not.toHaveBeenCalled();
  });

  it("非法额度档位（未知/缺失/非数字）→ 400", async () => {
    expect((await POST(req({ credits: 999 }))).status).toBe(400);
    expect((await POST(req({}))).status).toBe(400);
    expect((await POST(req({ credits: "50" }))).status).toBe(400);
    expect(createCreditCheckoutMock).not.toHaveBeenCalled();
  });

  it("渠道未配置 → 503", async () => {
    isConfiguredMock.mockReturnValue(false);
    expect((await POST(req({ credits: 50 }))).status).toBe(503);
    expect(createCreditCheckoutMock).not.toHaveBeenCalled();
  });

  it("合法档位 → 200 并透传 credits/email/userId 给渠道，返回 checkoutUrl", async () => {
    const res = await POST(req({ credits: 200 }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ checkoutUrl: "https://pay.example/checkout" });
    expect(createCreditCheckoutMock).toHaveBeenCalledWith(
      expect.objectContaining({ credits: 200, email: "a@b.c", userId: "u1" }),
    );
  });

  it("渠道抛错 → 500", async () => {
    createCreditCheckoutMock.mockRejectedValue(new Error("dodo down"));
    expect((await POST(req({ credits: 50 }))).status).toBe(500);
  });
});
