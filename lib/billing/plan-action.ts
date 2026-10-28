// 后台计费页：给定当前订阅与对比表上选中的 (档位, 周期)，该档按钮做什么。纯函数，便于穷举。
import { PLAN_ORDER, type BillingInterval, type PlanId } from "@/lib/plans";

export type PlanAction = "none" | "upgrade" | "downgrade" | "switchInterval";

export function planAction(
  current: { plan: PlanId; interval: BillingInterval | null },
  target: PlanId,
  interval: BillingInterval,
): PlanAction {
  // Free 不放按钮：降到 Free = 取消订阅，走渠道客户门户。
  if (target === "free") return "none";
  if (current.plan === "free") return "upgrade";
  if (target === current.plan) {
    // 迁移 057 之前建立的订阅没有记录周期，它们只可能是月付。
    return interval === (current.interval ?? "month") ? "none" : "switchInterval";
  }
  return PLAN_ORDER.indexOf(target) > PLAN_ORDER.indexOf(current.plan) ? "upgrade" : "downgrade";
}
