import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getDomainById, updateDomain } from "@/lib/domains-db";
import { getDomainVerification } from "@/lib/vercel";

export async function GET(
  _req: NextRequest,
  ctx: RouteContext<"/api/domains/[id]/status">
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const row = await getDomainById(id, session.user.id);
  if (!row) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }

  if (row.verified) {
    return NextResponse.json({ status: "verified" });
  }

  const vercelStatus = await getDomainVerification(row.domain);

  if (vercelStatus === "verified") {
    await updateDomain(id, session.user.id, { verified: true });
  }

  return NextResponse.json({ status: vercelStatus });
}
