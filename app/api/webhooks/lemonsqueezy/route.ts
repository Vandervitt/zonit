import { NextResponse } from "next/server";
import pool from "@/lib/db";
import { verifyWebhookSignature, getPlanFromVariantId } from "@/lib/lemonsqueezy";

const SUBSCRIPTION_EVENTS = new Set([
  "subscription_created",
  "subscription_updated",
  "subscription_cancelled",
  "subscription_expired",
]);

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-signature") ?? "";

  if (!verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: {
    meta: { event_name: string; custom_data?: { user_id?: string } };
    data: { id: string; attributes: { customer_id: number; variant_id: number; status: string } };
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const eventName = payload.meta.event_name;
  if (!SUBSCRIPTION_EVENTS.has(eventName)) {
    return NextResponse.json({ received: true });
  }

  const userId = payload.meta.custom_data?.user_id;
  if (!userId) {
    return NextResponse.json({ error: "Missing user_id in custom_data" }, { status: 400 });
  }

  const { customer_id, variant_id, status } = payload.data.attributes;
  const subscriptionId = payload.data.id;
  const isCancelled = eventName === "subscription_cancelled" || eventName === "subscription_expired";

  if (isCancelled) {
    await pool.query(
      "UPDATE users SET plan = 'free', ls_subscription_id = NULL WHERE id = $1",
      [userId],
    );
  } else {
    const plan = status === "paused" ? "free" : getPlanFromVariantId(variant_id);
    await pool.query(
      `UPDATE users
       SET plan = $1, ls_customer_id = $2, ls_subscription_id = $3
       WHERE id = $4`,
      [plan, String(customer_id), subscriptionId, userId],
    );
  }

  return NextResponse.json({ received: true });
}
