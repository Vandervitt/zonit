import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import {
  getDomainById,
  updateDomain,
  deleteDomainById,
  getEnabledDomainCount,
} from "@/lib/domains-db";
import { removeDomainFromProject } from "@/lib/vercel";

export async function PATCH(
  request: NextRequest,
  ctx: RouteContext<"/api/domains/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const { enabled, site_id } = body as { enabled?: boolean; site_id?: string };

  const existing = await getDomainById(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  if (enabled === true && !existing.enabled) {
    const [plan, count] = await Promise.all([
      getUserPlan(session.user.id),
      getEnabledDomainCount(session.user.id),
    ]);
    const limit = PLANS[plan].domainsLimit;
    if (limit !== Infinity && count >= limit) {
      return NextResponse.json({ error: ApiErrors.QUOTA_EXCEEDED }, { status: 403 });
    }
  }

  const updated = await updateDomain(id, session.user.id, {
    ...(enabled !== undefined && { enabled }),
    ...(site_id !== undefined && { site_id }),
  });

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  ctx: RouteContext<"/api/domains/[id]">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const existing = await getDomainById(id, session.user.id);
  if (!existing) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  await removeDomainFromProject(existing.domain).catch(() => {/* best-effort */});
  await deleteDomainById(id, session.user.id);

  return NextResponse.json({ ok: true });
}
