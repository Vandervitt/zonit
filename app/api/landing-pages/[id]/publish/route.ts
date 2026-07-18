import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { isLandingPageStructureValid } from "@/types/schema.draft";
import { collectFieldIssues } from "@/landing-editor/lib/validate";
import { collectContactIssues } from "@/landing-editor/lib/contactIssues";
import { getLandingPage, ensureUniqueSlug, publishLandingPage } from "@/lib/landing-pages/store";
import { getDomainById, bindDomainToLandingPage } from "@/lib/domains-db";
import { addDomainToProject } from "@/lib/vercel";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/publish">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  const { id } = await ctx.params;
  const { domainId, slug } = await request.json();

  const page = await getLandingPage(id, session.user.id);
  if (!page) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  if (
    !isLandingPageStructureValid(page.data) ||
    collectFieldIssues(page.data).length > 0 ||
    collectContactIssues(page.data).length > 0
  ) {
    return NextResponse.json({ error: ApiErrors.VALIDATION_FAILED }, { status: 422 });
  }

  if (!domainId) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_REQUIRED }, { status: 422 });
  }
  const domain = await getDomainById(domainId, session.user.id);
  if (!domain || !domain.enabled || !domain.verified) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });
  }

  // 幂等兜底：应用 DB 与 Vercel 项目域名是两套独立登记，若域名曾在 Vercel 后台被
  // 手工移除会与 DB 脱节，导致已发布页 DEPLOYMENT_NOT_FOUND。发布前重新挂载一次
  // （addDomainToProject 本身幂等），消除脱节盲区；Vercel 侧异常不阻断发布。
  try {
    await addDomainToProject(domain.domain);
  } catch (err) {
    console.error("发布时确保 Vercel 域名挂载失败（忽略）:", err);
  }

  const finalSlug = await ensureUniqueSlug(slug || page.slug || page.name, id);
  const bound = await bindDomainToLandingPage(domainId, session.user.id, id);
  if (!bound) return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });

  const published = await publishLandingPage(id, session.user.id, finalSlug);
  return NextResponse.json({ ...published, domain: domain.domain });
}
