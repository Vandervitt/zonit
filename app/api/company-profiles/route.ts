import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { nanoid } from "nanoid";
import { ApiErrors } from "@/lib/constants";
import { insertCompanyProfile, listCompanyProfiles } from "@/lib/company-profiles/db";
import { parseCompanyProfileInput } from "@/lib/company-profiles/input";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  return NextResponse.json(await listCompanyProfiles(session.user.id));
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = parseCompanyProfileInput(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const row = await insertCompanyProfile(nanoid(), session.user.id, parsed.input);
  return NextResponse.json(row, { status: 201 });
}
