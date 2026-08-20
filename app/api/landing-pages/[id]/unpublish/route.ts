import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { unpublishLandingPage } from "@/lib/landing-pages/store";
import { invalidatePublishedPage } from "@/lib/landing-pages/published-cache";

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/unpublish">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const row = await unpublishLandingPage(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  // 下线必须立即生效：不失效的话页面会在缓存窗口内继续对公众可见。
  invalidatePublishedPage(row.slug);
  return NextResponse.json(row);
}
