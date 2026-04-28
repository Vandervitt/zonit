import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { UserRole, ApiErrors } from "@/lib/constants";
import { listPresetTemplates, upsertPresetTemplate } from "@/lib/templates-db";
import { PresetTemplateSchema } from "@/lib/schema.zod";

export async function GET() {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const templates = await listPresetTemplates();
  return NextResponse.json({ templates });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await req.json();
  const parsed = PresetTemplateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Schema validation failed", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const saved = await upsertPresetTemplate(parsed.data, session.user.id);
  return NextResponse.json({ ok: true, template: saved });
}
