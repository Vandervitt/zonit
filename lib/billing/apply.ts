// 把规范化 BillingEvent 落库：更新 users 的套餐 / 充值余额 / 计费标识。
// 与具体 provider 无关，webhook 路由校验解析后统一调用。
//
// 时序守卫：渠道 webhook 不保证到达顺序（实测两次快速换档会出现旧事件后到、
// 覆盖新状态）。订阅类事件带 eventTime 时，仅当其不早于已应用的 billing_event_at
// 才生效，并推进该水位；缺失 eventTime 的事件按旧行为无条件应用（不动水位）。
import pool from "@/lib/db";
import type { BillingEvent, BillingProviderId } from "./types";

/** 时序守卫子句：eventTime 为空 → 恒真且不动水位；有值 → 比对并推进。 */
function guard(eventTime: string | null): { cond: string; setEventAt: string } {
  if (!eventTime) return { cond: "TRUE", setEventAt: "billing_event_at" };
  return {
    cond: "(billing_event_at IS NULL OR billing_event_at <= $G::timestamptz)",
    setEventAt: "GREATEST(COALESCE(billing_event_at, '-infinity'::timestamptz), $G::timestamptz)",
  };
}

/** 把 $G 占位替换为实际参数序号并拼接参数列表。 */
function withGuardParams(sql: string, params: unknown[], eventTime: string | null): [string, unknown[]] {
  if (!eventTime) return [sql.replaceAll("$G", "$0"), params]; // $0 不会出现（cond 恒真时无 $G）
  const idx = params.length + 1;
  return [sql.replaceAll("$G", `$${idx}`), [...params, eventTime]];
}

export async function applyBillingEvent(event: BillingEvent, provider: BillingProviderId): Promise<void> {
  switch (event.kind) {
    case "subscription_activated": {
      const g = guard(event.eventTime);
      const [sql, params] = withGuardParams(
        `UPDATE users
           SET plan = $1,
               billing_provider = $2,
               billing_customer_id = COALESCE($3, billing_customer_id),
               billing_subscription_id = COALESCE($4, billing_subscription_id),
               billing_expires_at = NULL,
               billing_event_at = ${g.setEventAt}
         WHERE id = $5 AND ${g.cond}`,
        [event.plan, provider, event.customerId ?? null, event.subscriptionId ?? null, event.userId],
        event.eventTime,
      );
      await pool.query(sql, params);
      return;
    }

    case "subscription_cancel_scheduled": {
      // 周期末取消：不动 plan，仅记录到期时间供展示；到期由 expired 事件回落。
      const g = guard(event.eventTime);
      const [sql, params] = withGuardParams(
        `UPDATE users SET billing_expires_at = $1, billing_event_at = ${g.setEventAt}
          WHERE id = $2 AND ${g.cond}`,
        [event.expiresAt, event.userId],
        event.eventTime,
      );
      await pool.query(sql, params);
      return;
    }

    case "subscription_ended": {
      const g = guard(event.eventTime);
      const [sql, params] = withGuardParams(
        `UPDATE users SET plan = 'free', billing_subscription_id = NULL, billing_expires_at = NULL,
               billing_event_at = ${g.setEventAt}
          WHERE id = $1 AND ${g.cond}`,
        [event.userId],
        event.eventTime,
      );
      await pool.query(sql, params);
      return;
    }

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
