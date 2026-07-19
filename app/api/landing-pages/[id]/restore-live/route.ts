import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { restoreDraftFromLive } from "@/lib/landing-pages/store";

export async function POST(_request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/restore-live">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  const { id } = await ctx.params;
  const row = await restoreDraftFromLive(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ page: row });
}
