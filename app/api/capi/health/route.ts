import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getCapiHealth } from "@/lib/capi/events-store";
import { summarizeCapiHealth } from "@/lib/capi/health";
import { resolveRange } from "@/lib/analytics/range";

/** 本租户的服务端回传健康度（不含任何凭据与 PII）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { searchParams } = request.nextUrl;
  const range = resolveRange({
    days: searchParams.get("days"),
    from: searchParams.get("from"),
    to: searchParams.get("to"),
  });
  const providers = await getCapiHealth(session.user.id, range);
  return NextResponse.json({ providers, summary: summarizeCapiHealth(providers) });
}
