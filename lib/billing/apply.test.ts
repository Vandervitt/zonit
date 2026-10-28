import { describe, it, expect, vi, beforeEach } from "vitest";

const queryMock = vi.fn();
vi.mock("@/lib/db", () => ({ default: { query: (...a: unknown[]) => queryMock(...a) } }));

import { applyBillingEvent } from "./apply";

beforeEach(() => {
  queryMock.mockReset();
  queryMock.mockResolvedValue({ rowCount: 1 });
});

describe("applyBillingEvent 计费周期", () => {
  it("订阅激活时把计费周期写入 billing_interval", async () => {
    await applyBillingEvent(
      { kind: "subscription_activated", userId: "u1", plan: "pro", interval: "year", subscriptionId: "s1", eventTime: null },
      "dodo",
    );
    const [sql, params] = queryMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toMatch(/billing_interval\s*=\s*\$\d+/);
    expect(params).toContain("year");
  });

  it("订阅结束时清空 billing_interval", async () => {
    await applyBillingEvent({ kind: "subscription_ended", userId: "u1", eventTime: null }, "dodo");
    const [sql] = queryMock.mock.calls[0] as [string];
    expect(sql).toMatch(/billing_interval\s*=\s*NULL/);
  });
});
