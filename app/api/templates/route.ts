import { NextResponse } from "next/server";
import { listPresetTemplates } from "@/lib/templates-db";

export async function GET() {
  const templates = await listPresetTemplates();
  return NextResponse.json({ templates });
}
