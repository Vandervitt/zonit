import { describe, it, expect } from "vitest";
import { parseCreemEvent, type CreemProductMap } from "./creem-events";

const map: CreemProductMap = {
  planByProduct: {
    prod_starter: "starter",
    prod_pro: "pro",
    prod_agency: "agency",
  },
  creditsByProduct: {
    prod_credits50: 50,
    prod_credits200: 200,
  },
};

/** Creem 订阅事件骨架：product/customer 为对象、metadata 在 subscription 上。 */
const sub = (eventType: string, productId: string, extra: Record<string, unknown> = {}) => ({
  id: "evt_1",
  eventType,
  object: {
    id: "sub_1",
    object: "subscription",
    product: { id: productId, billing_type: "recurring" },
    customer: { id: "cust_1", email: "a@b.com" },
    status: "active",
    metadata: { user_id: "u1" },
    ...extra,
  },
});

describe("parseCreemEvent — 订阅授权（active/paid/trialing）", () => {
  for (const t of ["subscription.active", "subscription.paid", "subscription.trialing"]) {
    it(`${t} → subscription_activated`, () => {
      expect(parseCreemEvent(sub(t, "prod_pro"), map)).toEqual({
        kind: "subscription_activated",
        userId: "u1",
        plan: "pro",
        customerId: "cust_1",
        subscriptionId: "sub_1",
      });
    });
  }

  it("customer 为字符串 id 也能取到 customerId", () => {
    const ev = sub("subscription.active", "prod_agency");
    (ev.object as Record<string, unknown>).customer = "cust_str";
    expect(parseCreemEvent(ev, map)).toMatchObject({ kind: "subscription_activated", customerId: "cust_str" });
  });

  it("缺 metadata.user_id → 忽略", () => {
    const ev = sub("subscription.active", "prod_pro");
    delete (ev.object as Record<string, unknown>).metadata;
    expect(parseCreemEvent(ev, map)).toEqual({ kind: "ignored" });
  });

  it("未知 product → 忽略", () => {
    expect(parseCreemEvent(sub("subscription.active", "prod_unknown"), map)).toEqual({ kind: "ignored" });
  });
});

describe("parseCreemEvent — 取消/结束", () => {
  it("subscription.canceled → 周期末取消（权益保留至 current_period_end_date）", () => {
    const ev = sub("subscription.canceled", "prod_agency", {
      status: "canceled",
      current_period_end_date: "2026-08-12T11:58:38.000Z",
      canceled_at: "2026-07-21T11:58:57.813Z",
    });
    expect(parseCreemEvent(ev, map)).toEqual({
      kind: "subscription_cancel_scheduled",
      userId: "u1",
      expiresAt: "2026-08-12T11:58:38.000Z",
    });
  });

  for (const t of ["subscription.expired", "subscription.paused"]) {
    it(`${t} → subscription_ended`, () => {
      expect(parseCreemEvent(sub(t, "prod_pro"), map)).toEqual({ kind: "subscription_ended", userId: "u1" });
    });
  }
});

describe("parseCreemEvent — checkout.completed 一次性充值", () => {
  const checkout = (orderType: string, productId: string) => ({
    id: "evt_2",
    eventType: "checkout.completed",
    object: {
      id: "ch_1",
      object: "checkout",
      order: { id: "ord_1", product: productId, type: orderType, status: "paid", customer: "cust_1" },
      product: { id: productId },
      customer: { id: "cust_1" },
      metadata: { user_id: "u1" },
      status: "completed",
    },
  });

  it("一次性订单命中 credits 产品 → credit_purchased", () => {
    expect(parseCreemEvent(checkout("onetime", "prod_credits200"), map)).toEqual({
      kind: "credit_purchased",
      userId: "u1",
      credits: 200,
    });
  });

  it("recurring 订单 → 忽略（由 subscription.active/paid 处理，避免双计）", () => {
    expect(parseCreemEvent(checkout("recurring", "prod_pro"), map)).toEqual({ kind: "ignored" });
  });

  it("一次性但非 credits 产品 → 忽略", () => {
    expect(parseCreemEvent(checkout("onetime", "prod_other"), map)).toEqual({ kind: "ignored" });
  });
});

describe("parseCreemEvent — 其它", () => {
  it("无关事件忽略：refund.created", () => {
    expect(parseCreemEvent({ eventType: "refund.created", object: {} }, map)).toEqual({ kind: "ignored" });
  });
  it("空事件忽略", () => {
    expect(parseCreemEvent({}, map)).toEqual({ kind: "ignored" });
  });
});
