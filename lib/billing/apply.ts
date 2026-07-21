// 把规范化 BillingEvent 落库：更新 users 的套餐 / 充值余额 / 计费标识。
// 与具体 provider 无关，webhook 路由校验解析后统一调用。
import pool from "@/lib/db";
import type { BillingEvent, BillingProviderId } from "./types";

export async function applyBillingEvent(event: BillingEvent, provider: BillingProviderId): Promise<void> {
  switch (event.kind) {
    case "subscription_activated":
      // 重新激活/续费/换档同时清掉此前的周期末取消标记。
      await pool.query(
        `UPDATE users
           SET plan = $1,
               billing_provider = $2,
               billing_customer_id = COALESCE($3, billing_customer_id),
               billing_subscription_id = COALESCE($4, billing_subscription_id),
               billing_expires_at = NULL
         WHERE id = $5`,
        [event.plan, provider, event.customerId ?? null, event.subscriptionId ?? null, event.userId],
      );
      return;

    case "subscription_cancel_scheduled":
      // 周期末取消：不动 plan，仅记录到期时间供展示；到期由 expired 事件回落。
      await pool.query(
        `UPDATE users SET billing_expires_at = $1 WHERE id = $2`,
        [event.expiresAt, event.userId],
      );
      return;

    case "subscription_ended":
      await pool.query(
        `UPDATE users SET plan = 'free', billing_subscription_id = NULL, billing_expires_at = NULL WHERE id = $1`,
        [event.userId],
      );
      return;

    case "credit_purchased":
      await pool.query(
        `UPDATE users SET ai_credit_balance = ai_credit_balance + $1 WHERE id = $2`,
        [event.credits, event.userId],
      );
      return;

    case "ignored":
      return;
  }
}
