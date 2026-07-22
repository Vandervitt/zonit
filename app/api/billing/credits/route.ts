import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getActiveProvider } from "@/lib/billing/provider";
import { CREDIT_PACK_AMOUNTS } from "@/lib/credits";

// AI 额度充值：创建一次性支付结账会话。额度到账由渠道 credit_purchased webhook 回写余额。
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { credits } = (await request.json().catch(() => ({}))) as { credits?: number };
  if (typeof credits !== "number" || !CREDIT_PACK_AMOUNTS.has(credits)) {
    return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
  }

  const provider = await getActiveProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: "收款渠道未配置，请联系管理员" }, { status: 503 });
  }

  const baseUrl = new URL(request.url).origin;

  try {
    const checkoutUrl = await provider.createCreditCheckout({
      credits,
      email: session.user.email,
      userId: session.user.id,
      baseUrl,
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
