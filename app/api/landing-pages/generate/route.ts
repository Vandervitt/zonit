import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { createLandingPage, listLandingPages } from "@/lib/landing-pages/store";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import { generateDraftFromBrief } from "@/lib/ai/generate";
import { checkAndConsume, hasAllowance } from "@/lib/ai/usage";
import type { GenerationBrief } from "@/lib/ai/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await request.json()) as { templateId?: string; brief?: GenerationBrief };
  if (!body.brief?.productName || !body.brief?.description) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const plan = await getUserPlan(userId);

  // 落地页数量上限（复用现有约束）
  const pageLimit = PLANS[plan].landingPagesLimit;
  if (pageLimit !== Infinity) {
    const existing = await listLandingPages(userId);
    if (existing.length >= pageLimit) {
      return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
    }
  }

  // AI 额度只读预检：无额度则直接拒绝，避免为无额度用户白跑（付费的）模型
  const quota = PLANS[plan].aiPageQuota;
  if (!(await hasAllowance(pool, userId, "page", quota))) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing", topup: "/admin/billing" } },
      { status: 403 },
    );
  }

  // 生成（失败不扣额度）
  const template = getTemplate(body.templateId);
  const result = await generateDraftFromBrief(template.draft, body.brief);
  if (!result.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_GENERATION_FAILED, reason: result.reason },
      { status: 422 },
    );
  }

  // 成功后扣额度（月额度优先，满则扣 credit）；并发耗尽时拒绝
  const consumed = await checkAndConsume(pool, userId, "page", quota);
  if (!consumed.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing", topup: "/admin/billing" } },
      { status: 403 },
    );
  }

  const row = await createLandingPage(userId, `${template.name} (AI)`, result.draft);
  return NextResponse.json(row, { status: 201 });
}
