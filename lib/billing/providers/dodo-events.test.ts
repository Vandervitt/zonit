import { describe, it, expect } from "vitest";
import { parseDodoEvent, type DodoProductMap } from "./dodo-events";

const map: DodoProductMap = {
  planByProduct: {
    pdt_starter: "starter",
    pdt_pro: "pro",
    pdt_agency: "agency",
  },
  creditsByProduct: {
    pdt_credits50: 50,
    pdt_credits200: 200,
  },
};

const sub = (type: string, productId: string, extra: Record<string, unknown> = {}) => ({
  type,
  data: {
    metadata: { user_id: "u1" },
    product_id: productId,
    subscription_id: "sub_1",
    customer: { customer_id: "cus_1", email: "a@b.com" },
    status: "active",
    ...extra,
  },
});

describe("parseDodoEvent — 订阅激活", () => {
  it("subscription.active → 按 product 映射套餐", () => {
    const r = parseDodoEvent(sub("subscription.active", "pdt_pro"), map);
    expect(r).toEqual({
      kind: "subscription_activated",
      userId: "u1",
      plan: "pro",
      customerId: "cus_1",
      subscriptionId: "sub_1",
    });
  });

  it("subscription.renewed 也视为激活续期", () => {
    const r = parseDodoEvent(sub("subscription.renewed", "pdt_starter"), map);
    expect(r).toMatchObject({ kind: "subscription_activated", plan: "starter" });
  });

  it("subscription.plan_changed 用新 product 更新套餐", () => {
    const r = parseDodoEvent(sub("subscription.plan_changed", "pdt_agency"), map);
    expect(r).toMatchObject({ kind: "subscription_activated", plan: "agency" });
  });

  it("缺 user_id 时忽略（无法归属）", () => {
    const ev = sub("subscription.active", "pdt_pro");
    delete (ev.data as Record<string, unknown>).metadata;
    expect(parseDodoEvent(ev, map)).toEqual({ kind: "ignored" });
  });

  it("未知 product 忽略", () => {
    expect(parseDodoEvent(sub("subscription.active", "pdt_unknown"), map)).toEqual({ kind: "ignored" });
  });
});

describe("parseDodoEvent — 订阅结束回落 free", () => {
  for (const t of ["subscription.expired", "subscription.on_hold", "subscription.failed"]) {
    it(`${t} → subscription_ended`, () => {
      const r = parseDodoEvent(sub(t, "pdt_pro"), map);
      expect(r).toEqual({ kind: "subscription_ended", userId: "u1" });
    });
  }
});

describe("parseDodoEvent — 周期末取消：保留权益并记录到期时间", () => {
  it("cancelled + cancel_at_next_billing_date=true → cancel_scheduled(带 next_billing_date)", () => {
    const r = parseDodoEvent(
      sub("subscription.cancelled", "pdt_agency", {
        cancel_at_next_billing_date: true,
        next_billing_date: "2026-08-04T00:00:00Z",
      }),
      map,
    );
    expect(r).toEqual({
      kind: "subscription_cancel_scheduled",
      userId: "u1",
      expiresAt: "2026-08-04T00:00:00Z",
    });
  });

  it("cancelled + cancel_at_next_billing_date=false（立即取消）→ subscription_ended", () => {
    const r = parseDodoEvent(
      sub("subscription.cancelled", "pdt_agency", { cancel_at_next_billing_date: false }),
      map,
    );
    expect(r).toEqual({ kind: "subscription_ended", userId: "u1" });
  });

  it("cancelled 缺 cancel_at_next_billing_date 字段 → 视为周期末取消（不提前剥夺已付权益）", () => {
    const r = parseDodoEvent(sub("subscription.cancelled", "pdt_agency"), map);
    expect(r).toMatchObject({ kind: "subscription_cancel_scheduled", userId: "u1" });
  });

  // Dodo 在切换取消标记时会发 plan_changed；若 payload 标记仍为取消中，
  // 不能按激活处理（会误清到期时间），需与事件到达顺序无关。
  it("plan_changed 但 payload 带 cancel_at_next_billing_date=true → 仍按周期末取消处理", () => {
    const r = parseDodoEvent(
      sub("subscription.plan_changed", "pdt_agency", {
        cancel_at_next_billing_date: true,
        next_billing_date: "2026-08-04T00:00:00Z",
      }),
      map,
    );
    expect(r).toEqual({
      kind: "subscription_cancel_scheduled",
      userId: "u1",
      expiresAt: "2026-08-04T00:00:00Z",
    });
  });

  it("plan_changed 且 cancel_at_next_billing_date=false（恢复订阅）→ 激活并将清掉到期标记", () => {
    const r = parseDodoEvent(
      sub("subscription.plan_changed", "pdt_agency", { cancel_at_next_billing_date: false }),
      map,
    );
    expect(r).toMatchObject({ kind: "subscription_activated", plan: "agency" });
  });
});

describe("parseDodoEvent — 一次性充值", () => {
  it("payment.succeeded 且非订阅、命中 credits 产品 → credit_purchased", () => {
    const ev = {
      type: "payment.succeeded",
      data: { metadata: { user_id: "u1" }, product_id: "pdt_credits200" },
    };
    expect(parseDodoEvent(ev, map)).toEqual({ kind: "credit_purchased", userId: "u1", credits: 200 });
  });

  it("payment.succeeded 但带 subscription_id（订阅首付）→ 忽略，避免双计", () => {
    const ev = {
      type: "payment.succeeded",
      data: { metadata: { user_id: "u1" }, product_id: "pdt_pro", subscription_id: "sub_1" },
    };
    expect(parseDodoEvent(ev, map)).toEqual({ kind: "ignored" });
  });

  it("product_cart 形态也能解析额度", () => {
    const ev = {
      type: "payment.succeeded",
      data: { metadata: { user_id: "u1" }, product_cart: [{ product_id: "pdt_credits50", quantity: 1 }] },
    };
    expect(parseDodoEvent(ev, map)).toEqual({ kind: "credit_purchased", userId: "u1", credits: 50 });
  });

  it("非 credits 产品的一次性支付 → 忽略", () => {
    const ev = { type: "payment.succeeded", data: { metadata: { user_id: "u1" }, product_id: "pdt_other" } };
    expect(parseDodoEvent(ev, map)).toEqual({ kind: "ignored" });
  });
});

describe("parseDodoEvent — 兼容 data.object 形态", () => {
  it("字段在 data.object 下也能读到", () => {
    const ev = {
      type: "subscription.active",
      data: { object: { metadata: { user_id: "u9" }, product_id: "pdt_pro", customer: { customer_id: "c9" } } },
    };
    expect(parseDodoEvent(ev, map)).toMatchObject({ kind: "subscription_activated", userId: "u9", plan: "pro", customerId: "c9" });
  });
});

describe("parseDodoEvent — 其它事件忽略", () => {
  it("payment.failed 忽略", () => {
    expect(parseDodoEvent({ type: "payment.failed", data: {} }, map)).toEqual({ kind: "ignored" });
  });
  it("空事件忽略", () => {
    expect(parseDodoEvent({}, map)).toEqual({ kind: "ignored" });
  });
});
