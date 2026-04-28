import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import { PLANS } from "@/lib/plans";
import {
  getUserDomains,
  getDomainByName,
  insertDomain,
  updateDomain,
  getEnabledDomainCount,
} from "@/lib/domains-db";
import { addDomainToProject } from "@/lib/vercel";

const DOMAIN_RE = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/i;

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

  const { domain, siteId } = await request.json();

  if (!domain || !siteId || !DOMAIN_RE.test(domain)) {
    return NextResponse.json({ error: ApiErrors.INVALID_DOMAIN }, { status: 400 });
  }

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
    
    // If it belongs to the same user, update the siteId and re-add to Vercel (idempotent)
    try {
      await addDomainToProject(domain);
    } catch (err) {
      console.error("Vercel API error (ignoring if already exists):", err);
    }

    const updated = await updateDomain(existing.id, session.user.id, { site_id: siteId, enabled: true });
    return NextResponse.json(updated, { status: 200 });
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
    siteId,
    domain,
  });

  if (vercelConfig.verified) {
    await updateDomain(row.id, session.user.id, { verified: true });
    row.verified = true;
  }

  return NextResponse.json({ ...row, cname: vercelConfig.cname }, { status: 201 });
}
