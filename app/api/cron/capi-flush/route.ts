import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getRetryableEvents } from "@/lib/capi/events-store";
import { flushEvents } from "@/lib/capi/dispatch";

/** Vercel Cron 兜底：重发未成功的 CAPI 事件。鉴权用 CRON_SECRET。 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const authHeader = request.headers.get("authorization");
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  const rows = await getRetryableEvents();
  await flushEvents(rows);
  return NextResponse.json({ flushed: rows.length });
}
