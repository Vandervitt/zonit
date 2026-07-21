import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getActiveProvider } from "@/lib/billing/provider";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { planId } = (await request.json()) as { planId: string };
  if (!planId || planId === "free") {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const provider = await getActiveProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: "收款渠道未配置，请联系管理员" }, { status: 503 });
  }

  const baseUrl = new URL(request.url).origin;

  try {
    const checkoutUrl = await provider.createCheckout({
      planId,
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
