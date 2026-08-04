import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getAnalytics, isAttributionDimension, DEFAULT_DIMENSION } from "@/lib/analytics/queries";
import { resolveRange } from "@/lib/analytics/range";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const url = new URL(request.url);
  const pageId = url.searchParams.get("pageId") ?? "all";
  // 区间：自定义 from/to 优先，非法一律回落预设——报表页不该因一个坏 query 参数整页打不开。
  const range = resolveRange({
    days: url.searchParams.get("days"),
    from: url.searchParams.get("from"),
    to: url.searchParams.get("to"),
  });
  // 维度非法一律回落默认值——它会被拼进 SQL 列名，不接受白名单外的取值。
  const dimRaw = url.searchParams.get("dimension");
  const dimension = isAttributionDimension(dimRaw) ? dimRaw : DEFAULT_DIMENSION;
  const data = await getAnalytics(session.user.id, pageId, range, dimension);
  return NextResponse.json(data);
}
