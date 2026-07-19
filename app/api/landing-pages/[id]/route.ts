import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getLandingPage, updateLandingPageDraft, deleteLandingPage, renameLandingPage } from "@/lib/landing-pages/store";

/** Postgres 唯一约束冲突（23505）：同名落地页撞 idx_landing_pages_user_name。 */
function isUniqueViolation(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { code?: string }).code === "23505";
}

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
  // 名称清洗：空名不落库（保留旧名），避免列表出现无名页。
  const trimmed = typeof name === "string" ? name.trim() : "";
  try {
    const row = await updateLandingPageDraft(id, session.user.id, {
      name: trimmed || undefined,
      data,
    });
    if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: ApiErrors.NAME_TAKEN }, { status: 409 });
    }
    throw err;
  }
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
  try {
    const row = await renameLandingPage(id, session.user.id, trimmed);
    if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
    return NextResponse.json(row);
  } catch (err) {
    if (isUniqueViolation(err)) {
      return NextResponse.json({ error: ApiErrors.NAME_TAKEN }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteLandingPage(id, session.user.id);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
