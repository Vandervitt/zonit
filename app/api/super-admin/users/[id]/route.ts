import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, ApiErrors } from "@/lib/constants";
import type { PlanId } from "@/lib/plans";
import {
  getUserAdminDetail,
  updateUserAdminFields,
  type AdminUserPatch,
} from "@/lib/super-admin/users-db";

const COMP_PLANS: ReadonlyArray<string> = ["starter", "pro", "agency"];
const ROLES: ReadonlyArray<string> = [UserRole.USER, UserRole.SUPER_ADMIN];

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

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const user = await getUserAdminDetail(id);
  if (!user) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ user });
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireSuperAdmin();
  if (guard.error) return guard.error;
  const { id } = await ctx.params;
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const patch: AdminUserPatch = {};
  if ("compPlan" in body) {
    if (body.compPlan !== null && !COMP_PLANS.includes(body.compPlan)) {
      return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
    }
    patch.compPlan = body.compPlan as PlanId | null;
  }
  if ("role" in body) {
    if (!ROLES.includes(body.role)) {
      return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
    }
    patch.role = body.role;
  }
  if ("disabled" in body) {
    if (typeof body.disabled !== "boolean") {
      return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
    }
    patch.disabled = body.disabled;
  }
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  // 自我保护：不允许对自己降权/禁用/赠送
  if (id === guard.session.user.id) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const ok = await updateUserAdminFields(id, patch);
  if (!ok) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json({ ok: true });
}
