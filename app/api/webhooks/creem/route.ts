import { NextResponse } from "next/server";

// Creem webhook 占位端点。Creem provider 尚未实现，端点先返回 501，
// 待接入 Creem 时替换为验签 + applyBillingEvent(event, "creem")。
export async function POST() {
  return NextResponse.json({ error: "Creem webhook not implemented" }, { status: 501 });
}
