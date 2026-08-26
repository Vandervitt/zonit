import { NextResponse, after } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { applyBriefChannels } from "@/lib/ai/brief-contact";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";
import {
  createLandingPage,
  listLandingPages,
  getLandingPage,
  ensureUniqueName,
} from "@/lib/landing-pages/store";
import { createAiJob } from "@/lib/landing-pages/ai-jobs";
import { performGeneration, runGenerationJob } from "@/lib/landing-pages/generate-job";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import { hasAllowance } from "@/lib/ai/usage";
import type { GenerationBrief } from "@/lib/ai/types";
import type { LandingPageDraft } from "@/types/schema.draft";

/**
 * 生成主体挪到了 after() 里跑（编辑器内路径），这个值现在只约束「同步部分」还剩多少余量
 * 给 after() 的后台任务——保留跟 page-check 系列一致的量级，别让它比后台任务本身还短。
 */
export const maxDuration = 300;

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;

  const body = (await request.json()) as {
    templateId?: string;
    pageId?: string;
    brief?: GenerationBrief;
  };
  if (!body.brief?.productName || !body.brief?.description) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  // 输入长度上限：限制送入模型的文本规模，控制 token 成本与提示注入面。
  const b = body.brief;
  if (
    b.productName.length > 200 ||
    b.description.length > 4000 ||
    (b.pastedIntro?.length ?? 0) > 8000 ||
    (b.targetAudience?.length ?? 0) > 500 ||
    (b.tone?.length ?? 0) > 200 ||
    (b.ctaGoal?.length ?? 0) > 200
  ) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }

  const plan = await getUserPlan(userId);

  // 两种模式：
  // - 编辑器内（body.pageId）：为「已建好的空白落地页」原地生成文案。异步——生成本身
  //   （跨太平洋打 DashScope，单次实测 60+ 秒）挪进 after() 后台跑，这里只建 job 立刻回 202，
  //   前端轮询 job 状态。不占用「新建数量」名额。
  // - 旧建页模式（无 pageId）：按模板新建一张落地页（保留兼容，受落地页数量上限约束）。
  //   目前没有调用方在用这条路径，维持原有同步行为，不做异步化——没有真实场景就不引入抽象。
  const inEditor = typeof body.pageId === "string" && body.pageId.length > 0;

  // 落地页数量上限仅约束「新建」；编辑器内原地生成不新增页面，跳过该校验。
  if (!inEditor) {
    const pageLimit = PLANS[plan].landingPagesLimit;
    if (pageLimit !== Infinity) {
      const existing = await listLandingPages(userId);
      if (existing.length >= pageLimit) {
        return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
      }
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

  // base 草稿来源：编辑器内取该页当前草稿（越权则 404）；否则按模板加载。
  let baseDraft: LandingPageDraft;
  if (inEditor) {
    const page = await getLandingPage(body.pageId!, userId);
    if (!page) {
      return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
    }
    baseDraft = page.data;
  } else {
    baseDraft = await loadTemplateDraft(body.templateId); // 草稿体按需加载
  }

  // 向导里勾的「咨询渠道」落成结构化的 contact，而不只是喂 prompt 影响遣词——
  // 用户明确选了电话，生成出来的页面主渠道就该是电话，而不是模板默认的 WhatsApp。
  // 只定主渠道不填值：AI 编不出用户的真实号码，值由用户在联系方式面板里填。
  baseDraft = applyBriefChannels(baseDraft, body.brief.ctaGoal);

  if (inEditor) {
    const job = await createAiJob(userId, body.pageId!);
    const brief = body.brief;
    // 响应先发出去，生成本身（可能 1~2 分钟）在响应发出后继续跑；
    // runGenerationJob 自己兜住所有异常，job 一定会落到终态，不会卡死在 pending。
    after(() => runGenerationJob({ jobId: job.id, pageId: body.pageId!, userId, baseDraft, brief, quota }));
    return NextResponse.json({ jobId: job.id }, { status: 202 });
  }

  const result = await performGeneration(baseDraft, body.brief, userId, quota);
  if (!result.ok) {
    return NextResponse.json(
      { error: ApiErrors.AI_GENERATION_FAILED, reason: result.reason },
      { status: 422 },
    );
  }

  const template = getTemplate(body.templateId);
  const name = await ensureUniqueName(userId, `${template.name} (AI)`);
  const row = await createLandingPage(userId, name, result.draft);
  return NextResponse.json(row, { status: 201 });
}
