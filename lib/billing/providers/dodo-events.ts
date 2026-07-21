// Dodo webhook 原始事件 → 规范化 BillingEvent 的纯映射（无网络，可单测）。
// Dodo 文档中 webhook data 字段存在两种形态（data.* 与 data.object.*），此处做防御性读取。
import type { PlanId } from "@/lib/plans";
import type { BillingEvent } from "../types";

/** product_id ↔ 套餐/额度映射（由 env 装配，测试可注入假配置）。 */
export interface DodoProductMap {
  /** 订阅产品 → 套餐档。 */
  planByProduct: Record<string, PlanId>;
  /** 一次性产品 → 充值额度。 */
  creditsByProduct: Record<string, number>;
}

const SUB_ACTIVE = new Set(["subscription.active", "subscription.renewed", "subscription.plan_changed"]);
const SUB_ENDED = new Set(["subscription.expired", "subscription.on_hold", "subscription.failed"]);

type AnyRec = Record<string, unknown>;

/** 取 data 主体，兼容 data 与 data.object 两种形态。 */
function dataOf(event: AnyRec): AnyRec {
  const data = (event.data ?? {}) as AnyRec;
  const object = data.object as AnyRec | undefined;
  return object ?? data;
}

function userIdOf(d: AnyRec): string | undefined {
  const meta = d.metadata as AnyRec | undefined;
  const v = meta?.user_id;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function stringField(d: AnyRec, key: string): string | undefined {
  const v = d[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

/** 从一次性支付事件里解析出充值额度（兼容 product_id 与 product_cart[]）。 */
function creditsOf(d: AnyRec, map: DodoProductMap): number {
  const direct = stringField(d, "product_id");
  if (direct && map.creditsByProduct[direct]) return map.creditsByProduct[direct];
  const cart = d.product_cart;
  if (Array.isArray(cart)) {
    for (const item of cart) {
      const pid = (item as AnyRec)?.product_id;
      if (typeof pid === "string" && map.creditsByProduct[pid]) return map.creditsByProduct[pid];
    }
  }
  return 0;
}

export function parseDodoEvent(event: AnyRec, map: DodoProductMap): BillingEvent {
  const type = typeof event.type === "string" ? event.type : "";
  const d = dataOf(event);
  const userId = userIdOf(d);

  if (SUB_ACTIVE.has(type)) {
    const productId = stringField(d, "product_id");
    const plan = productId ? map.planByProduct[productId] : undefined;
    if (!userId || !plan) return { kind: "ignored" };
    return {
      kind: "subscription_activated",
      userId,
      plan,
      customerId: customerIdOf(d),
      subscriptionId: stringField(d, "subscription_id"),
    };
  }

  if (SUB_ENDED.has(type)) {
    if (!userId) return { kind: "ignored" };
    return { kind: "subscription_ended", userId };
  }

  // 取消：Dodo 默认周期末取消（cancel_at_next_billing_date），已付周期内权益保留，
  // 到期由 subscription.expired 回落 free；仅显式立即取消（false）才马上结束。
  // 字段缺失按周期末处理，避免提前剥夺已付权益。
  if (type === "subscription.cancelled") {
    if (!userId) return { kind: "ignored" };
    if (d.cancel_at_next_billing_date === false) return { kind: "subscription_ended", userId };
    return {
      kind: "subscription_cancel_scheduled",
      userId,
      expiresAt: stringField(d, "next_billing_date") ?? stringField(d, "cancelled_at") ?? null,
    };
  }

  // 一次性充值：payment.succeeded 且不属于订阅（订阅首付由 subscription.* 处理，避免双计）。
  if (type === "payment.succeeded") {
    if (stringField(d, "subscription_id")) return { kind: "ignored" };
    const credits = creditsOf(d, map);
    if (!userId || credits <= 0) return { kind: "ignored" };
    return { kind: "credit_purchased", userId, credits };
  }

  return { kind: "ignored" };
}

function customerIdOf(d: AnyRec): string | undefined {
  const customer = d.customer as AnyRec | undefined;
  const v = customer?.customer_id;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}
