import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getAnalytics, isAttributionDimension, DEFAULT_DIMENSION } from "@/lib/analytics/queries";

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
  // 维度非法一律回落默认值——它会被拼进 SQL 列名，不接受白名单外的取值。
  const dimRaw = url.searchParams.get("dimension");
  const dimension = isAttributionDimension(dimRaw) ? dimRaw : DEFAULT_DIMENSION;
  const data = await getAnalytics(session.user.id, pageId, days, dimension);
  return NextResponse.json(data);
}
