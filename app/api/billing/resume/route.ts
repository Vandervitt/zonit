import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getProvider } from "@/lib/billing/provider";
import type { BillingProviderId } from "@/lib/billing/types";

// 恢复订阅：撤销周期末取消，订阅继续正常续费。
// 到期标记的清除由渠道 plan_changed（cancel 标记翻转）webhook 回写。
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
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
    await getProvider(providerId).resume(subscriptionId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
