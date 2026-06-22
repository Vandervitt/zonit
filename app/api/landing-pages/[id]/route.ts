import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getLandingPage, updateLandingPageDraft, deleteLandingPage, renameLandingPage } from "@/lib/landing-pages/store";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const row = await getLandingPage(id, session.user.id);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const { name, data } = await request.json();
  const row = await updateLandingPageDraft(id, session.user.id, { name, data });
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const { name } = await request.json();
  const trimmed = typeof name === "string" ? name.trim() : "";
  if (!trimmed || trimmed.length > 100) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  const row = await renameLandingPage(id, session.user.id, trimmed);
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteLandingPage(id, session.user.id);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
