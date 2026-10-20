import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { sanitizeSignupSource } from "@/lib/attribution/signup-source";
import { recordSignupSource } from "@/lib/attribution/signup-source-db";

/**
 * 注册后由后台补报一次首触来源（浏览器自报，仅作运营统计，不参与权限与计费）。
 * 只写当前会话用户；已有来源或注册超过窗口期时不改写，返回 recorded=false。
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const source = sanitizeSignupSource(body);
  if (!source) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const recorded = await recordSignupSource(session.user.id, source);
  return NextResponse.json({ recorded });
}
