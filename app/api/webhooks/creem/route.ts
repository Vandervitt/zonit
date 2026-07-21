import { NextResponse } from "next/server";
import { creemProvider } from "@/lib/billing/providers/creem";
import { applyBillingEvent } from "@/lib/billing/apply";

// Creem webhook 端点（各渠道独立，各自验签）。
// 即使 super-admin 切到 Dodo，仍保留本端点处理 Creem 存量订阅的续费/取消。
export async function POST(request: Request) {
  const rawBody = await request.text();
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });

  let event;
  try {
    event = await creemProvider.verifyAndParse(rawBody, headers);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  try {
    await applyBillingEvent(event, "creem");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
