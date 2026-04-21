import {
  lemonSqueezySetup,
  createCheckout,
  getCustomer,
} from "@lemonsqueezy/lemonsqueezy.js";
import crypto from "crypto";
import type { PlanId } from "@/lib/plans";

lemonSqueezySetup({ apiKey: process.env.LEMONSQUEEZY_API_KEY! });

const PLAN_VARIANT: Record<string, string> = {
  starter: process.env.LEMONSQUEEZY_VARIANT_STARTER!,
  pro:     process.env.LEMONSQUEEZY_VARIANT_PRO!,
  agency:  process.env.LEMONSQUEEZY_VARIANT_AGENCY!,
};

const VARIANT_PLAN: Record<string, PlanId> = Object.fromEntries(
  Object.entries(PLAN_VARIANT).map(([plan, variantId]) => [variantId, plan as PlanId]),
);

export function getPlanFromVariantId(variantId: string | number): PlanId {
  return VARIANT_PLAN[String(variantId)] ?? "free";
}

export async function createCheckoutUrl(
  planId: string,
  email: string,
  userId: string,
  baseUrl: string,
): Promise<string> {
  const variantId = PLAN_VARIANT[planId];
  if (!variantId) throw new Error(`No LS variant configured for plan: ${planId}`);

  const { data, error } = await createCheckout(
    process.env.LEMONSQUEEZY_STORE_ID!,
    variantId,
    {
      checkoutOptions: { embed: false, media: false },
      checkoutData: {
        email,
        custom: { user_id: userId },
      },
      productOptions: {
        redirectUrl: `${baseUrl}/billing?success=1`,
      },
    },
  );

  if (error) throw new Error(error.message);
  return data!.data.attributes.url;
}

export async function getPortalUrl(lsCustomerId: string): Promise<string> {
  const { data, error } = await getCustomer(lsCustomerId);
  if (error) throw new Error(error.message);
  const url = data!.data.attributes.urls.customer_portal;
  if (!url) throw new Error("Customer portal URL not available");
  return url;
}

export function verifyWebhookSignature(
  rawBody: string,
  signature: string,
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const hmac = crypto.createHmac("sha256", secret);
  const digest = hmac.update(rawBody).digest("hex");
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest, "hex"),
      Buffer.from(signature, "hex"),
    );
  } catch {
    return false;
  }
}
