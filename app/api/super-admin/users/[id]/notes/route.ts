import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, ApiErrors } from "@/lib/constants";
import { addUserNote } from "@/lib/super-admin/users-db";

const MAX_NOTE_LENGTH = 2000;

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 403 });
  }
  const { id } = await ctx.params;
  const payload = await req.json().catch(() => null);
  const body = typeof payload?.body === "string" ? payload.body.trim() : "";
  if (!body || body.length > MAX_NOTE_LENGTH) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  const ok = await addUserNote(id, session.user.id, body);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true }, { status: 201 });
}
