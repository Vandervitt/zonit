import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { PLANS } from "@/lib/plans";
import type { PlanId } from "@/lib/plans";
import {
  upsertAccountCredential, deleteAccountCredential, listAccountProviders,
} from "@/lib/capi/credentials";
import type { CapiProviderId } from "@/lib/capi/types";

const PROVIDERS: CapiProviderId[] = ["meta", "tiktok"];
const isProvider = (v: unknown): v is CapiProviderId => typeof v === "string" && PROVIDERS.includes(v as CapiProviderId);

/** 服务端回传属高级追踪，与页级凭据同一道套餐门控。 */
const hasAdvancedTracking = (plan: unknown): boolean => PLANS[(plan ?? "free") as PlanId]?.advancedTracking === true;

/** 列出账号级已配置的 provider（含 Dataset ID，不含 token）。 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  return NextResponse.json(await listAccountProviders(session.user.id));
}

/** upsert 账号级凭据：这个广告主的默认 Dataset，所有未单独覆盖的页都用它。 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  if (!hasAdvancedTracking(session.user.plan))
    return NextResponse.json({ error: ApiErrors.PLAN_REQUIRED }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { provider, accessToken, externalId } = body as Record<string, unknown>;
  if (!isProvider(provider) || typeof accessToken !== "string" || typeof externalId !== "string"
      || !accessToken.trim() || !externalId.trim())
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  await upsertAccountCredential(session.user.id, provider, accessToken.trim(), externalId.trim());
  return NextResponse.json({ ok: true });
}

/** 删除账号级凭据。页级覆盖不受影响（它们本就不读账号级）。 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const provider = request.nextUrl.searchParams.get("provider") ?? "";
  if (!isProvider(provider)) return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  await deleteAccountCredential(session.user.id, provider);
  return new NextResponse(null, { status: 204 });
}
