import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { markLeadRead, deleteLead } from "@/lib/leads/store";

export async function PATCH(request: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const { isRead } = await request.json();
  const row = await markLeadRead(id, session.user.id, Boolean(isRead));
  if (!row) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/leads/[id]">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { id } = await ctx.params;
  const ok = await deleteLead(id, session.user.id);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return new NextResponse(null, { status: 204 });
}
