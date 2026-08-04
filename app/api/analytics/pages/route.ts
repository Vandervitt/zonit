import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getPagePerformance } from "@/lib/analytics/queries";

const ALLOWED_DAYS = new Set([7, 30, 90]);

/** 名下所有落地页的横向对比（同时管多个客户时每天要看的第一眼）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const daysRaw = Number(request.nextUrl.searchParams.get("days") ?? "30");
  const days = ALLOWED_DAYS.has(daysRaw) ? daysRaw : 30;
  return NextResponse.json(await getPagePerformance(session.user.id, days));
}
