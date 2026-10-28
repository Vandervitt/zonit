import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getActiveProvider } from "@/lib/billing/provider";
import { parsePlanSelection } from "@/lib/billing/products";
import { PlanProductNotConfiguredError } from "@/lib/billing/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as { planId?: unknown; interval?: unknown };
  const selection = parsePlanSelection(body.planId, body.interval);
  if (!selection) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const provider = await getActiveProvider();
  if (!provider.isConfigured()) {
    return NextResponse.json({ error: ApiErrors.BILLING_NOT_CONFIGURED }, { status: 503 });
  }

  const baseUrl = new URL(request.url).origin;

  try {
    const checkoutUrl = await provider.createCheckout({
      planId: selection.plan,
      interval: selection.interval,
      email: session.user.email,
      userId: session.user.id,
      baseUrl,
    });
    return NextResponse.json({ checkoutUrl });
  } catch (err) {
    if (err instanceof PlanProductNotConfiguredError) {
      return NextResponse.json({ error: err.code }, { status: 503 });
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
