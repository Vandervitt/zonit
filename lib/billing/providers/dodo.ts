// Dodo Payments provider 实现。产品 id 由 env 装配，webhook 用 standardwebhooks 验签后走纯解析。
import DodoPayments from "dodopayments";
import { Webhook } from "standardwebhooks";
import type { PlanId } from "@/lib/plans";
import type { BillingEvent, BillingProvider, CreateCheckoutInput } from "../types";
import { parseDodoEvent, type DodoProductMap } from "./dodo-events";

/** 从 env 装配 product 映射（缺失的项跳过，isConfigured 会校验必需项）。 */
export function dodoProductMap(): DodoProductMap {
  const planByProduct: Record<string, PlanId> = {};
  const add = (id: string | undefined, plan: PlanId) => { if (id) planByProduct[id] = plan; };
  add(process.env.DODO_PRODUCT_STARTER, "starter");
  add(process.env.DODO_PRODUCT_PRO, "pro");
  add(process.env.DODO_PRODUCT_AGENCY, "agency");

  const creditsByProduct: Record<string, number> = {};
  if (process.env.DODO_CREDITS_50) creditsByProduct[process.env.DODO_CREDITS_50] = 50;
  if (process.env.DODO_CREDITS_200) creditsByProduct[process.env.DODO_CREDITS_200] = 200;

  return { planByProduct, creditsByProduct };
}

function productForPlan(planId: string): string | undefined {
  const byPlan: Record<string, string | undefined> = {
    starter: process.env.DODO_PRODUCT_STARTER,
    pro: process.env.DODO_PRODUCT_PRO,
    agency: process.env.DODO_PRODUCT_AGENCY,
  };
  return byPlan[planId];
}

function client(): DodoPayments {
  const environment = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
  return new DodoPayments({ bearerToken: process.env.DODO_PAYMENTS_API_KEY!, environment });
}

export const dodoProvider: BillingProvider = {
  id: "dodo",

  isConfigured(): boolean {
    return Boolean(
      process.env.DODO_PAYMENTS_API_KEY &&
      process.env.DODO_PAYMENTS_WEBHOOK_KEY &&
      process.env.DODO_PRODUCT_STARTER &&
      process.env.DODO_PRODUCT_PRO &&
      process.env.DODO_PRODUCT_AGENCY,
    );
  },

  async createCheckout({ planId, email, userId, baseUrl }: CreateCheckoutInput): Promise<string> {
    const productId = productForPlan(planId);
    if (!productId) throw new Error(`No Dodo product configured for plan: ${planId}`);

    const session = await client().checkoutSessions.create({
      product_cart: [{ product_id: productId, quantity: 1 }],
      customer: { email, name: email },
      return_url: `${baseUrl}/admin/billing?success=1`,
      metadata: { user_id: userId },
    });
    if (!session.checkout_url) throw new Error("Dodo returned no checkout_url");
    return session.checkout_url;
  },

  async getPortalUrl(customerId: string): Promise<string> {
    const session = await client().customers.customerPortal.create(customerId);
    if (!session.link) throw new Error("Dodo returned no customer portal link");
    return session.link;
  },

  async changePlan(subscriptionId: string, planId: string): Promise<void> {
    const productId = productForPlan(planId);
    if (!productId) throw new Error(`No Dodo product configured for plan: ${planId}`);
    // 按比例立即计费/抵扣；扣款失败则不切换（避免降到付不起的档还生效）。
    await client().subscriptions.changePlan(subscriptionId, {
      product_id: productId,
      quantity: 1,
      proration_billing_mode: "prorated_immediately",
      on_payment_failure: "prevent_change",
    });
  },

  async verifyAndParse(rawBody: string, headers: Record<string, string>): Promise<BillingEvent> {
    const wh = new Webhook(process.env.DODO_PAYMENTS_WEBHOOK_KEY!);
    // 验签失败会抛错，交由路由返回 401。
    await wh.verify(rawBody, headers);
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    return parseDodoEvent(event, dodoProductMap());
  },
};
