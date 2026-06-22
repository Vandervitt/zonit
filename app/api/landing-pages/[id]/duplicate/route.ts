import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { duplicateLandingPage, listLandingPages } from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/duplicate">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  // 套餐落地页数量上限：与新建一致，达上限拦截
  const plan = await getUserPlan(session.user.id);
  const limit = PLANS[plan].landingPagesLimit;
  if (limit !== Infinity) {
    const existing = await listLandingPages(session.user.id);
    if (existing.length >= limit) {
      return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
    }
  }

  const { id } = await ctx.params;
  const row = await duplicateLandingPage(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row, { status: 201 });
}
