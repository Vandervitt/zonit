// Creem webhook 原始事件 → 规范化 BillingEvent 的纯映射（无网络，可单测）。
// 结构参考官方 payload：object 为 subscription/checkout，product/customer 可能是对象或字符串 id，
// checkout 时的 metadata 会透传到 subscription（user_id 归属靠它）。
import type { PlanId } from "@/lib/plans";
import type { BillingEvent } from "../types";

/** product id ↔ 套餐/额度映射（由 env 装配，测试可注入假配置）。 */
export interface CreemProductMap {
  planByProduct: Record<string, PlanId>;
  creditsByProduct: Record<string, number>;
}

// Creem 授权语义（对应其 onGrantAccess）：active/paid/trialing 均视为已授权。
const SUB_GRANT = new Set(["subscription.active", "subscription.paid", "subscription.trialing"]);
// 撤销访问（对应 onRevokeAccess）：expired/paused；canceled 单独处理为周期末取消。
const SUB_REVOKE = new Set(["subscription.expired", "subscription.paused"]);

type AnyRec = Record<string, unknown>;

function idOf(v: unknown): string | undefined {
  if (typeof v === "string" && v.length > 0) return v;
  if (v && typeof v === "object") {
    const id = (v as AnyRec).id;
    if (typeof id === "string" && id.length > 0) return id;
  }
  return undefined;
}

function userIdOf(obj: AnyRec): string | undefined {
  const meta = obj.metadata as AnyRec | undefined;
  const v = meta?.user_id;
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

function stringField(obj: AnyRec, key: string): string | undefined {
  const v = obj[key];
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

export function parseCreemEvent(event: AnyRec, map: CreemProductMap): BillingEvent {
  const type = typeof event.eventType === "string" ? event.eventType : "";
  const obj = (event.object ?? {}) as AnyRec;
  const userId = userIdOf(obj);

  if (SUB_GRANT.has(type)) {
    const productId = idOf(obj.product);
    const plan = productId ? map.planByProduct[productId] : undefined;
    if (!userId || !plan) return { kind: "ignored" };
    return {
      kind: "subscription_activated",
      userId,
      plan,
      customerId: idOf(obj.customer),
      subscriptionId: idOf(obj.id) ?? stringField(obj, "id"),
    };
  }

  // Creem 的取消保留访问至当期结束（撤销由 expired/paused 触发）→ 周期末取消。
  if (type === "subscription.canceled") {
    if (!userId) return { kind: "ignored" };
    return {
      kind: "subscription_cancel_scheduled",
      userId,
      expiresAt: stringField(obj, "current_period_end_date") ?? null,
    };
  }

  if (SUB_REVOKE.has(type)) {
    if (!userId) return { kind: "ignored" };
    return { kind: "subscription_ended", userId };
  }

  // 一次性充值：checkout.completed 且订单非 recurring（订阅由 subscription.* 处理，避免双计）。
  if (type === "checkout.completed") {
    const order = (obj.order ?? {}) as AnyRec;
    if (order.type === "recurring") return { kind: "ignored" };
    const productId = idOf(order.product) ?? idOf(obj.product);
    const credits = productId ? map.creditsByProduct[productId] ?? 0 : 0;
    if (!userId || credits <= 0) return { kind: "ignored" };
    return { kind: "credit_purchased", userId, credits };
  }

  return { kind: "ignored" };
}
