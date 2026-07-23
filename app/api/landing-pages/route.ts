import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { loadTemplateDraft } from "@/landing-editor/samples/registry.drafts";
import { createLandingPage, listLandingPages, ensureUniqueName } from "@/lib/landing-pages/store";
import { getUserPlanOrNull } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import { recordMilestone } from "@/lib/platform-milestones";

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

  // 会话有效但用户已不在库（如本地库重置 / 重建后旧 JWT 仍指向已消失的 user.id）：
  // 直接 INSERT 会触发外键 23503 报 500，这里提前返回 401 引导重新登录。
  const plan = await getUserPlanOrNull(session.user.id);
  if (plan === null) {
    return NextResponse.json({ error: ApiErrors.SESSION_STALE }, { status: 401 });
  }

  // 套餐落地页数量上限：达到后拦截新建，引导升级
  const limit = PLANS[plan].landingPagesLimit;
  if (limit !== Infinity) {
    const existing = await listLandingPages(session.user.id);
    if (existing.length >= limit) {
      return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
    }
  }

  const { templateId } = await request.json();
  const template = getTemplate(templateId); // 未命中回退默认模板
  const draft = await loadTemplateDraft(templateId); // 草稿体按需加载
  // 同模板可重复创建：撞 (user_id, name) 唯一约束时自动追加「 2」「 3」…，避免 500。
  const name = await ensureUniqueName(session.user.id, template.name);
  const row = await createLandingPage(session.user.id, name, draft);
  await recordMilestone(session.user.id, "page_created");
  return NextResponse.json(row, { status: 201 });
}
