// Creem provider 实现（备份收款渠道）。REST 很薄，直接 fetch，不引入 SDK。
// 验签：HMAC-SHA256(raw body, CREEM_WEBHOOK_SECRET) 十六进制，对比 creem-signature 头。
import crypto from "crypto";
import type { PlanId } from "@/lib/plans";
import type { BillingEvent, BillingProvider, CreateCheckoutInput, CreateCreditCheckoutInput } from "../types";
import { parseCreemEvent, type CreemProductMap } from "./creem-events";

export function creemProductMap(): CreemProductMap {
  const planByProduct: Record<string, PlanId> = {};
  const add = (id: string | undefined, plan: PlanId) => { if (id) planByProduct[id] = plan; };
  add(process.env.CREEM_PRODUCT_STARTER, "starter");
  add(process.env.CREEM_PRODUCT_PRO, "pro");
  add(process.env.CREEM_PRODUCT_AGENCY, "agency");

  const creditsByProduct: Record<string, number> = {};
  if (process.env.CREEM_CREDITS_50) creditsByProduct[process.env.CREEM_CREDITS_50] = 50;
  if (process.env.CREEM_CREDITS_200) creditsByProduct[process.env.CREEM_CREDITS_200] = 200;

  return { planByProduct, creditsByProduct };
}

function productForPlan(planId: string): string | undefined {
  const byPlan: Record<string, string | undefined> = {
    starter: process.env.CREEM_PRODUCT_STARTER,
    pro: process.env.CREEM_PRODUCT_PRO,
    agency: process.env.CREEM_PRODUCT_AGENCY,
  };
  return byPlan[planId];
}

function productForCredits(credits: number): string | undefined {
  const byCredits: Record<number, string | undefined> = {
    50: process.env.CREEM_CREDITS_50,
    200: process.env.CREEM_CREDITS_200,
  };
  return byCredits[credits];
}

function apiBase(): string {
  return process.env.CREEM_ENVIRONMENT === "live_mode" ? "https://api.creem.io" : "https://test-api.creem.io";
}

async function creemPost<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: { "x-api-key": process.env.CREEM_API_KEY!, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`creem ${res.status}: ${text.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

export const creemProvider: BillingProvider = {
  id: "creem",

  isConfigured(): boolean {
    return Boolean(
      process.env.CREEM_API_KEY &&
      process.env.CREEM_WEBHOOK_SECRET &&
      process.env.CREEM_PRODUCT_STARTER &&
      process.env.CREEM_PRODUCT_PRO &&
      process.env.CREEM_PRODUCT_AGENCY,
    );
  },

  async createCheckout({ planId, email, userId, baseUrl }: CreateCheckoutInput): Promise<string> {
    const productId = productForPlan(planId);
    if (!productId) throw new Error(`No Creem product configured for plan: ${planId}`);

    const session = await creemPost<{ checkout_url?: string; url?: string }>("/v1/checkouts", {
      product_id: productId,
      success_url: `${baseUrl}/admin/billing?success=1`,
      customer: { email },
      metadata: { user_id: userId },
    });
    const url = session.checkout_url ?? session.url;
    if (!url) throw new Error("Creem returned no checkout_url");
    return url;
  },

  async createCreditCheckout({ credits, email, userId, baseUrl }: CreateCreditCheckoutInput): Promise<string> {
    const productId = productForCredits(credits);
    if (!productId) throw new Error(`No Creem product configured for credits: ${credits}`);

    const session = await creemPost<{ checkout_url?: string; url?: string }>("/v1/checkouts", {
      product_id: productId,
      success_url: `${baseUrl}/admin/billing?topup=1`,
      customer: { email },
      metadata: { user_id: userId },
    });
    const url = session.checkout_url ?? session.url;
    if (!url) throw new Error("Creem returned no checkout_url");
    return url;
  },

  async getPortalUrl(customerId: string): Promise<string> {
    const res = await creemPost<{ customer_portal_link?: string }>("/v1/customers/billing", {
      customer_id: customerId,
    });
    if (!res.customer_portal_link) throw new Error("Creem returned no customer_portal_link");
    return res.customer_portal_link;
  },

  async changePlan(subscriptionId: string, planId: string): Promise<void> {
    const productId = productForPlan(planId);
    if (!productId) throw new Error(`No Creem product configured for plan: ${planId}`);
    // Creem 的 upgrade 端点同时处理升档与降档，按比例立即计费。
    await creemPost(`/v1/subscriptions/${encodeURIComponent(subscriptionId)}/upgrade`, {
      product_id: productId,
      update_behavior: "proration-charge-immediately",
    });
  },

  async resume(): Promise<void> {
    // Creem 未提供公开的撤销取消 API，引导用户走客户门户处理。
    throw new Error("Creem 渠道暂不支持在线恢复订阅，请通过「管理订阅」进入客户门户操作");
  },

  async verifyAndParse(rawBody: string, headers: Record<string, string>): Promise<BillingEvent> {
    const secret = process.env.CREEM_WEBHOOK_SECRET;
    const signature = headers["creem-signature"] ?? "";
    if (!secret || !signature) throw new Error("Missing creem signature");
    const digest = crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    const ok =
      digest.length === signature.length &&
      crypto.timingSafeEqual(Buffer.from(digest, "utf8"), Buffer.from(signature, "utf8"));
    if (!ok) throw new Error("Invalid creem signature");
    const event = JSON.parse(rawBody) as Record<string, unknown>;
    return parseCreemEvent(event, creemProductMap());
  },
};
