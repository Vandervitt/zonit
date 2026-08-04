import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getPagePerformance } from "@/lib/analytics/queries";
import { resolveRange } from "@/lib/analytics/range";

/** 名下所有落地页的横向对比（同时管多个客户时每天要看的第一眼）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { searchParams } = request.nextUrl;
  const range = resolveRange({
    days: searchParams.get("days"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });
  return NextResponse.json(await getPagePerformance(session.user.id, range));
}
