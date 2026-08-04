import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getCapiHealth } from "@/lib/capi/events-store";
import { summarizeCapiHealth } from "@/lib/capi/health";

const ALLOWED_DAYS = new Set([7, 30, 90]);

/** 本租户的服务端回传健康度（不含任何凭据与 PII）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const daysRaw = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const days = ALLOWED_DAYS.has(daysRaw) ? daysRaw : 30;
  const providers = await getCapiHealth(session.user.id, days);
  return NextResponse.json({ providers, summary: summarizeCapiHealth(providers) });
}
