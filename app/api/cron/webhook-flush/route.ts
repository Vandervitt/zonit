import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRetryableDeliveries } from "@/lib/webhooks/deliveries-store";
import { deliverMany } from "@/lib/webhooks/dispatch";

/** Vercel Cron 兜底：重投未成功的 webhook。鉴权用 CRON_SECRET。 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await getRetryableDeliveries();
  await deliverMany(rows);
  return NextResponse.json({ flushed: rows.length });
}
