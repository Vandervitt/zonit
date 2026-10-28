// Dodo Payments provider 实现。产品 id 由 env 装配，webhook 用 standardwebhooks 验签后走纯解析。
import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";
import type { BillingInterval, PaidPlanId } from "@/lib/pricing/dodo-prices";
import { planProductMap, productFor, type PlanProductIds } from "../products";
import {
  PlanProductNotConfiguredError,
  type BillingEvent,
  type BillingProvider,
  type CreateCheckoutInput,
  type CreateCreditCheckoutInput,
} from "../types";
import { parseDodoEvent, type DodoProductMap } from "./dodo-events";

/** 从 env 装配 product 映射（缺失的项跳过，isConfigured 会校验必需项）。 */
/** 各付费档 × 周期的产品 id（env）。年付产品对应 *_YEARLY。 */
export function dodoPlanProductIds(): PlanProductIds {
  return {
    pro: { month: process.env.DODO_PRODUCT_PRO, year: process.env.DODO_PRODUCT_PRO_YEARLY },
    agency: { month: process.env.DODO_PRODUCT_AGENCY, year: process.env.DODO_PRODUCT_AGENCY_YEARLY },
  };
}

/** 从 env 装配 product 映射（缺失的项跳过，isConfigured 会校验必需项）。 */
export function dodoProductMap(): DodoProductMap {
  const creditsByProduct: Record<string, number> = {};
  if (process.env.DODO_CREDITS_50) creditsByProduct[process.env.DODO_CREDITS_50] = 50;
  if (process.env.DODO_CREDITS_200) creditsByProduct[process.env.DODO_CREDITS_200] = 200;

  return { planByProduct: planProductMap(dodoPlanProductIds()), creditsByProduct };
}

function productForPlan(planId: PaidPlanId, interval: BillingInterval): string {
  const id = productFor(dodoPlanProductIds(), planId, interval);
  if (!id) throw new PlanProductNotConfiguredError(`No Dodo product configured for ${planId} (${interval})`);
  return id;
}

function productForCredits(credits: number): string | undefined {
  const byCredits: Record<number, string | undefined> = {
    50: process.env.DODO_CREDITS_50,
    200: process.env.DODO_CREDITS_200,
  };
  return byCredits[credits];
}

/** 按 env 装配 SDK 客户端；构建期价格同步脚本（scripts/sync-dodo-prices.ts）也复用它。 */
export function dodoClient(): DodoPayments {
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
  return new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY!, environment });
}

export const dodoProvider: BillingProvider = {
  id: "dodo",

  isConfigured(): boolean {
    return Boolean(
      process.env.DODO_PAYMENTS_API_KEY &&
      process.env.DODO_PAYMENTS_WEBHOOK_KEY &&
      // 主收款渠道：月付与年付产品必须配齐（定价页对所有访客展示年付）。
      process.env.DODO_PRODUCT_PRO &&
      process.env.DODO_PRODUCT_PRO_YEARLY &&
      process.env.DODO_PRODUCT_AGENCY &&
      process.env.DODO_PRODUCT_AGENCY_YEARLY,
    );
  },

  async createCheckout({ planId, interval, email, userId, baseUrl }: CreateCheckoutInput): Promise<string> {
    const productId = productForPlan(planId, interval);

    const session = await dodoClient().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email, name: email },
      return_url: `${baseUrl}/admin/billing?success=1`,
      metadata: { user_id: userId },
    });
    if (!session.checkout_url) throw new Error("Dodo returned no checkout_url");
    return session.checkout_url;
  },

  async createCreditCheckout({ credits, email, userId, baseUrl }: CreateCreditCheckoutInput): Promise<string> {
    const productId = productForCredits(credits);
    if (!productId) throw new Error(`No Dodo product configured for credits: ${credits}`);

    const session = await dodoClient().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email, name: email },
      // 一次性充值成功后回 billing 页，用 topup=1 触发充值成功提示（与订阅 success=1 区分）。
      return_url: `${baseUrl}/admin/billing?topup=1`,
      metadata: { user_id: userId },
    });
    if (!session.checkout_url) throw new Error("Dodo returned no checkout_url");
    return session.checkout_url;
  },

  async getPortalUrl(customerId: string): Promise<string> {
    const session = await dodoClient().customers.customerPortal.create(customerId);
    if (!session.link) throw new Error("Dodo returned no customer portal link");
    return session.link;
  },

  async changePlan(subscriptionId: string, planId: PaidPlanId, interval: BillingInterval): Promise<void> {
    const productId = productForPlan(planId, interval);
    // 按比例立即计费/抵扣；扣款失败则不切换（避免降到付不起的档还生效）。
    await dodoClient().subscriptions.changePlan(subscriptionId, {
      product_id: productId,
      quantity: 1,
      proration_billing_mode: "prorated_immediately",
      on_payment_failure: "prevent_change",
    });
  },

  async resume(subscriptionId: string): Promise<void> {
    // 撤销周期末取消：清掉 cancel_at_next_billing_date，订阅恢复正常续费。
    await dodoClient().subscriptions.update(subscriptionId, { cancel_at_next_billing_date: false });
  },

  async verifyAndParse(rawBody: string, headers: Record<string, string>): Promise<BillingEvent> {
    const wh = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!);
    // 验签失败会抛错，交由路由返回 401。
    await wh.verify(rawBody, headers);
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    return parseDodoEvent(event, dodoProductMap());
  },
};
