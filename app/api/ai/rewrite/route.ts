import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import { rewriteText } from "@/lib/ai/generate";
import { checkAndConsume, hasAllowance } from "@/lib/ai/usage";
import type { RewriteRequest } from "@/lib/ai/types";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await request.json()) as RewriteRequest;
  if (!body?.field || typeof body.currentText !== "string") {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  // 输入长度上限：控制 token 成本与提示注入面。
  if (body.currentText.length > 2000 || (body.instruction?.length ?? 0) > 500) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const plan = await getUserPlan(userId);
  const quota = PLANS[plan].aiRewriteQuota;

  // 只读预检：无额度直接拒绝，不调用（付费的）模型
  if (!(await hasAllowance(pool, userId, "rewrite", quota))) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing" } },
      { status: 403 },
    );
  }

  // 调用模型（失败不扣额度）
  let result: Awaited<ReturnType<typeof rewriteText>>;
  try {
    result = await rewriteText(body);
  } catch {
    return NextResponse.json({ error: ApiErrors.AI_GENERATION_FAILED }, { status: 422 });
  }

  // 成功后扣额度（仅月额度，改写不消耗 credit）；并发耗尽时拒绝
  const consumed = await checkAndConsume(pool, userId, "rewrite", quota);
  if (!consumed.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_QUOTA_EXHAUSTED, hints: { upgrade: "/pricing" } },
      { status: 403 },
    );
  }

  return NextResponse.json(result);
}
