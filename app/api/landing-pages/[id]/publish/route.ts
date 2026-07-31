import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { isLandingPageStructureValid } from "@/types/schema.draft";
import { collectPublishIssues } from "@/landing-editor/lib/publishIssues";
import { getLandingPage, ensureUniqueSlug, publishLandingPage } from "@/lib/landing-pages/store";
import { getDomainById, bindDomainToLandingPage } from "@/lib/domains-db";
import { isReservedRoutePath, normalizeRoutePath, ROOT_PATH } from "@/lib/domains/route-path";
import { addDomainToProject } from "@/lib/vercel";
import { recordMilestone } from "@/lib/platform-milestones";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/publish">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  const { id } = await ctx.params;
  const { domainId, slug, path: rawPath } = await request.json();

  const page = await getLandingPage(id, session.user.id);
  if (!page) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  // 与客户端 ValidationBar / 发布按钮同一份门槛（collectPublishIssues），两端标准一致。
  if (!isLandingPageStructureValid(page.data) || collectPublishIssues(page.data).length > 0) {
    return NextResponse.json({ error: ApiErrors.VALIDATION_FAILED }, { status: 422 });
  }

  if (!domainId) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_REQUIRED }, { status: 422 });
  }
  const domain = await getDomainById(domainId, session.user.id);
  if (!domain || !domain.enabled || !domain.verified) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });
  }

  // 路径校验必须在写库前完成：保留路径在 proxy 里先于租户解析返回，
  // 放进去就是「发布成功但永远 404」，客户无从自查。
  const path = normalizeRoutePath(rawPath ?? ROOT_PATH);
  if (!path) {
    return NextResponse.json({ error: ApiErrors.PATH_INVALID }, { status: 422 });
  }
  if (isReservedRoutePath(path)) {
    return NextResponse.json({ error: ApiErrors.PATH_RESERVED }, { status: 422 });
  }
  // 位置被占用时沿用既有的「覆盖式替换」语义（原页从该位置下线），
  // 不在此处硬拦：发布弹窗已就该位置给出显式警告与「改绑并发布」确认。
  // 改成 409 会把一个已经设计好的确认流程变成报错。

  // 幂等兜底：应用 DB 与 Vercel 项目域名是两套独立登记，若域名曾在 Vercel 后台被
  // 手工移除会与 DB 脱节，导致已发布页 DEPLOYMENT_NOT_FOUND。发布前重新挂载一次
  // （addDomainToProject 本身幂等），消除脱节盲区；Vercel 侧异常不阻断发布。
  try {
    await addDomainToProject(domain.domain);
  } catch (err) {
    console.error("发布时确保 Vercel 域名挂载失败（忽略）:", err);
  }

  const finalSlug = await ensureUniqueSlug(slug || page.slug || page.name, id);
  const bound = await bindDomainToLandingPage(domainId, session.user.id, id, path);
  if (!bound) return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });

  const published = await publishLandingPage(id, session.user.id, finalSlug);
  await recordMilestone(session.user.id, "page_published");
  return NextResponse.json({ ...published, domain: domain.domain, path });
}
