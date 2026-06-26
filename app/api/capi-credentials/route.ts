import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { upsertCredential, deleteCredential, listConfiguredProviders, pageOwnedBy } from "@/lib/capi/credentials";
import type { CapiProviderId } from "@/lib/capi/types";

const PROVIDERS: CapiProviderId[] = ["meta", "tiktok"];
const isProvider = (v: unknown): v is CapiProviderId => typeof v === "string" && PROVIDERS.includes(v as CapiProviderId);

/** 列出该 page 已配置的 provider（不含 token）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const pageId = request.nextUrl.searchParams.get("pageId") ?? "";
  if (!pageId || !(await pageOwnedBy(pageId, session.user.id)))
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  return NextResponse.json(await listConfiguredProviders(pageId));
}

/** upsert 凭据。 */
export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const { pageId, provider, accessToken, externalId } = body as Record<string, unknown>;
  if (typeof pageId !== "string" || !isProvider(provider) || typeof accessToken !== "string" || typeof externalId !== "string"
      || !accessToken.trim() || !externalId.trim())
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  if (!(await pageOwnedBy(pageId, session.user.id)))
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  await upsertCredential(pageId, provider, accessToken.trim(), externalId.trim());
  return NextResponse.json({ ok: true });
}

/** 删除凭据（UI 关闭 serverSide 时）。 */
export async function DELETE(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const pageId = request.nextUrl.searchParams.get("pageId") ?? "";
  const provider = request.nextUrl.searchParams.get("provider") ?? "";
  if (!pageId || !isProvider(provider)) return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  if (!(await pageOwnedBy(pageId, session.user.id)))
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  await deleteCredential(pageId, provider);
  return new NextResponse(null, { status: 204 });
}
