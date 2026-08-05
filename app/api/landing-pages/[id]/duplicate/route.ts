import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { LOCALE_COOKIE } from "@/lib/i18n/config";
import { getAdminDictionary, resolveAdminLocale } from "@/lib/i18n/admin";
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
  // 副本后缀跟随用户的后台语言：页面名是后台内部标识，不对外展示。
  const locale = resolveAdminLocale(session.user.locale, (await cookies()).get(LOCALE_COOKIE)?.value);
  const copySuffix = getAdminDictionary(locale).pages.toast.copySuffix;
  const row = await duplicateLandingPage(id, session.user.id, copySuffix);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row, { status: 201 });
}
