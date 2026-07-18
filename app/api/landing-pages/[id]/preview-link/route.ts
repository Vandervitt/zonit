import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getLandingPage, ensurePreviewSecret, rotatePreviewSecret } from "@/lib/landing-pages/store";
import { signPreviewToken } from "@/lib/preview/token";
import { previewSharePath } from "@/lib/constants/routes";

const PREVIEW_TTL_MS = 7 * 24 * 3600 * 1000;

// 自包含拼接绝对 URL（剥 base 尾斜杠，避免 //preview）。刻意不依赖 lib/host.appUrl，
// 使本分支与 PR #30 的合并顺序解耦、无冲突。
const absoluteUrl = (path: string) => `${(process.env.NEXT_PUBLIC_APP_URL ?? "").replace(/\/+$/, "")}${path}`;

export async function POST(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/preview-link">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  const { id } = await ctx.params;
  const page = await getLandingPage(id, session.user.id);
  if (!page) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  let rotate = false;
  try { rotate = (await request.json())?.rotate === true; } catch { /* 空 body：默认不轮换 */ }

  const secret = rotate
    ? await rotatePreviewSecret(id, session.user.id)
    : await ensurePreviewSecret(id, session.user.id);
  if (!secret) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  const expMs = Date.now() + PREVIEW_TTL_MS;
  const token = signPreviewToken({ pageId: id, expMs, previewSecret: secret, authSecret: process.env.AUTH_SECRET ?? "" });

  return NextResponse.json({ url: absoluteUrl(previewSharePath(token)), expiresAt: new Date(expMs).toISOString() });
}
