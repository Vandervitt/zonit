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

  const existing = await getDomainByName(domain);
  if (existing) {
    return NextResponse.json({ error: ApiErrors.DOMAIN_TAKEN }, { status: 409 });
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
