import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getAnalytics } from "@/lib/analytics/queries";

const ALLOWED_DAYS = new Set([7, 30, 90]);

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId") ?? "all";
  const daysRaw = Number(url.searchParams.get("days") ?? "30");
  const days = ALLOWED_DAYS.has(daysRaw) ? daysRaw : 30;
  const data = await getAnalytics(session.user.id, pageId, days);
  return NextResponse.json(data);
}
