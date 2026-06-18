import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { createLandingPage, listLandingPages } from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const rows = await listLandingPages(session.user.id);
  return NextResponse.json(rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  // 套餐落地页数量上限：达到后拦截新建，引导升级
  const plan = await getUserPlan(session.user.id);
  const limit = PLANS[plan].landingPagesLimit;
  if (limit !== Infinity) {
    const existing = await listLandingPages(session.user.id);
    if (existing.length >= limit) {
      return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
    }
  }

  const { templateId } = await request.json();
  const template = getTemplate(templateId); // 未命中回退默认模板
  const row = await createLandingPage(session.user.id, template.name, template.draft);
  return NextResponse.json(row, { status: 201 });
}
