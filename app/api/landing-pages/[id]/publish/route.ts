import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { isLandingPageStructureValid } from "@/types/schema.draft";
import { collectFieldIssues } from "@/landing-editor/lib/validate";
import { getLandingPage, ensureUniqueSlug, publishLandingPage } from "@/lib/landing-pages/store";
import { getDomainById, bindDomainToLandingPage } from "@/lib/domains-db";

export async function POST(request: NextRequest, ctx: RouteContext<"/api/landing-pages/[id]/publish">) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });

  const { id } = await ctx.params;
  const { domainId, slug } = await request.json();

  const page = await getLandingPage(id, session.user.id);
  if (!page) return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });

  if (!isLandingPageStructureValid(page.data) || collectFieldIssues(page.data).length > 0) {
    return NextResponse.json({ error: ApiErrors.VALIDATION_FAILED }, { status: 422 });
  }

  if (!domainId) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_REQUIRED }, { status: 422 });
  }
  const domain = await getDomainById(domainId, session.user.id);
  if (!domain || !domain.enabled || !domain.verified) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });
  }

  const finalSlug = await ensureUniqueSlug(slug || page.slug || page.name, id);
  const bound = await bindDomainToLandingPage(domainId, session.user.id, id);
  if (!bound) return NextResponse.json({ error: ApiErrors.DOMAIN_NOT_VERIFIED }, { status: 422 });

  const published = await publishLandingPage(id, session.user.id, finalSlug);
  return NextResponse.json({ ...published, domain: domain.domain });
}
