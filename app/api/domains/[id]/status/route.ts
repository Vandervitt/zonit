import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getDomainById, updateDomain } from "@/lib/domains-db";
import { getDomainVerification, getDomainConfigHealth } from "@/lib/vercel";

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

  // 已验证 ≠ DNS 已生效：域名曾在同一 Vercel 账号下会免验证秒过，但 A/CNAME
  // 可能仍指向别处（发布成为静默空操作），故已验证域名附带配置健康检测。
  if (row.verified) {
    const health = await getDomainConfigHealth(row.domain);
    return NextResponse.json({ status: "verified", health });
  }

  const vercelStatus = await getDomainVerification(row.domain);

  if (vercelStatus === "verified") {
    await updateDomain(id, session.user.id, { verified: true });
  }

  return NextResponse.json({ status: vercelStatus });
}
