// 订阅产品 id ↔ (档位, 计费周期) 的双向映射，Dodo / Creem 共用。
// 产品 id 来自各渠道的环境变量（见各 provider 的 planProductIds），此处只做纯映射，便于单测。
import {
  BILLING_INTERVALS,
  PAID_PLAN_IDS,
  type BillingInterval,
  type PaidPlanId,
} from "@/lib/pricing/dodo-prices";

export interface PlanProduct {
  plan: PaidPlanId;
  interval: BillingInterval;
}

/** 各付费档 × 周期的产品 id；未配置的为 undefined。 */
export type PlanProductIds = Record<PaidPlanId, Record<BillingInterval, string | undefined>>;

export function productFor(ids: PlanProductIds, plan: PaidPlanId, interval: BillingInterval): string | undefined {
  return ids[plan][interval];
}

/** 反查表：产品 id → (档位, 周期)，webhook 据此判定订阅落到哪一档、哪个周期。 */
export function planProductMap(ids: PlanProductIds): Record<string, PlanProduct> {
  const map: Record<string, PlanProduct> = {};
  for (const plan of PAID_PLAN_IDS) {
    for (const interval of BILLING_INTERVALS) {
      const id = ids[plan][interval];
      if (id) map[id] = { plan, interval };
    }
  }
  return map;
}

/** 入参校验：只接受付费档与合法周期（缺省月付，兼容旧前端）。 */
export function parsePlanSelection(
  planId: unknown,
  interval: unknown,
): { plan: PaidPlanId; interval: BillingInterval } | null {
  if (typeof planId !== "string" || !(PAID_PLAN_IDS as readonly string[]).includes(planId)) return null;
  const iv = interval ?? "month";
  if (typeof iv !== "string" || !(BILLING_INTERVALS as readonly string[]).includes(iv)) return null;
  return { plan: planId as PaidPlanId, interval: iv as BillingInterval };
}
