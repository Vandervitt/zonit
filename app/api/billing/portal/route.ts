import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getProvider } from "@/lib/billing/provider";
import type { BillingProviderId } from "@/lib/billing/types";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  // 门户按用户订阅实际所在的渠道路由（可能与当前 active provider 不同）。
  const result = await pool.query(
    "SELECT billing_provider, billing_customer_id FROM users WHERE id = $1",
    [session.user.id],
  );
  const providerId = result.rows[0]?.billing_provider as BillingProviderId | undefined;
  const customerId = result.rows[0]?.billing_customer_id as string | undefined;

  if (!providerId || !customerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    const portalUrl = await getProvider(providerId).getPortalUrl(customerId);
    return NextResponse.json({ portalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
