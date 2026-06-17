import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getTemplate } from "@/landing-editor/samples/registry";
import { createLandingPage, listLandingPages } from "@/lib/landing-pages/store";

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
  const { templateId } = await request.json();
  const template = getTemplate(templateId); // 未命中回退默认模板
  const row = await createLandingPage(session.user.id, template.name, template.draft);
  return NextResponse.json(row, { status: 201 });
}
