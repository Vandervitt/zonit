import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, ApiErrors } from "@/lib/constants";
import { listFeedback, markFeedbackRead } from "@/lib/feedback";

async function requireSuperAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 }) };
  }
  if (session.user.role !== UserRole.SUPER_ADMIN) {
    return { error: NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 403 }) };
  }
  return { session };
}

export async function GET() {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;
  return NextResponse.json({ feedback: await listFeedback() });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;

  const body = await req.json().catch(() => null);
  if (!body || typeof body.id !== "string" || typeof body.isRead !== "boolean") {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const ok = await markFeedbackRead(body.id, body.isRead);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
