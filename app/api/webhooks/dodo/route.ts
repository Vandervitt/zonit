import { NextResponse } from "next/server";
import { dodoProvider } from "@/lib/billing/providers/dodo";
import { applyBillingEvent } from "@/lib/billing/apply";

// Dodo webhook 端点（各渠道独立，各自验签）。
// 即使 super-admin 切到 Creem，仍需保留本端点以处理 Dodo 存量订阅的续费/取消。
export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  let event;
  try {
    event = await dodoProvider.verifyAndParse(rawBody, headers);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    await applyBillingEvent(event, "dodo");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
