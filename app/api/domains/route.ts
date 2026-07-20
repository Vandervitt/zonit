import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { ApiErrors } from "@/lib/constants";
import { PLANS } from "@/lib/plans";
import {
  getUserDomains,
  getDomainByName,
  insertDomain,
  updateDomain,
  getEnabledDomainCount,
  bindDomainToLandingPage,
} from "@/lib/domains-db";
import { addDomainToProject, type DnsRecord } from "@/lib/vercel";
import { isMainlandChinaDomain, mainlandNsProvider, normalizeDomain } from "@/lib/domain";
import { lookupNameservers } from "@/lib/domain-ns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const domains = await getUserDomains(session.user.id);
  return NextResponse.json(domains);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { domain: rawDomain, landingPageId } = await request.json();

  const domain = typeof rawDomain === "string" ? normalizeDomain(rawDomain) : null;
  if (!domain) {
    return NextResponse.json({ error: ApiErrors.INVALID_DOMAIN }, { status: 400 });
  }

  if (isMainlandChinaDomain(domain)) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_TLD_BLOCKED }, { status: 400 });
  }

  // 大陆 DNS 服务商软提示（不阻断）：目标客群常在阿里云/腾讯买域名做海外投放，
  // 命中仅随响应返回 mainlandNs 供前端展示风险提醒；解析失败 fail-open。
  const mainlandNs = mainlandNsProvider(await lookupNameservers(domain));

  // Check plan limits
  const currentPlan = (session.user.plan ?? "free") as keyof typeof PLANS;
  const limit = PLANS[currentPlan].domainsLimit;
  const count = await getEnabledDomainCount(session.user.id);

  const existing = await getDomainByName(domain);
  if (existing) {
    if (existing.user_id !== session.user.id) {
      return NextResponse.json({ error: ApiErrors.DOMAIN_TAKEN }, { status: 409 });
    }

    // If enabling a domain that was disabled, check limit
    if (!existing.enabled && limit !== Infinity && count >= limit) {
      return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
    }
    
    // Belongs to the same user: re-enable and re-add to Vercel (idempotent)
    let records: DnsRecord[] = [];
    try {
      records = (await addDomainToProject(domain)).records;
    } catch (err) {
      console.error("Vercel API error (ignoring if already exists):", err);
    }

    const updated = await updateDomain(existing.id, session.user.id, { enabled: true });
    if (landingPageId) {
      await bindDomainToLandingPage(existing.id, session.user.id, landingPageId);
    }
    return NextResponse.json({ ...updated, records, mainlandNs }, { status: 200 });
  }

  // New domain, check limit
  if (limit !== Infinity && count >= limit) {
    return NextResponse.json({ error: ApiErrors.LIMIT_EXCEEDED }, { status: 403 });
  }

  let vercelConfig;
  try {
    vercelConfig = await addDomainToProject(domain);
  } catch {
    return NextResponse.json({ error: ApiErrors.VERCEL_API_ERROR }, { status: 502 });
  }

  const row = await insertDomain({
    id: nanoid(),
    userId: session.user.id,
    landingPageId: landingPageId ?? null,
    domain,
  });

  if (vercelConfig.verified) {
    await updateDomain(row.id, session.user.id, { verified: true });
    row.verified = true;
  }

  return NextResponse.json({ ...row, records: vercelConfig.records, mainlandNs }, { status: 201 });
}
