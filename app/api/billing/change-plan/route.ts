import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getProvider } from "@/lib/billing/provider";
import type { BillingProviderId } from "@/lib/billing/types";

const PAID_PLANS = new Set(["starter", "pro", "agency"]);

// 已订阅用户升/降档：改现有订阅的 product（走渠道 change-plan/upgrade API），
// 禁止走 checkout 另开新订阅（会重复扣费）。档位落库由 subscription.plan_changed webhook 回写。
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { planId } = (await request.json().catch(() => ({}))) as { planId?: string };
  if (!planId || !PAID_PLANS.has(planId)) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const result = await pool.query(
    "SELECT billing_provider, billing_subscription_id FROM users WHERE id = $1",
    [session.user.id],
  );
  const providerId = result.rows[0]?.billing_provider as BillingProviderId | undefined;
  const subscriptionId = result.rows[0]?.billing_subscription_id as string | undefined;

  if (!providerId || !subscriptionId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    await getProvider(providerId).changePlan(subscriptionId, planId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
