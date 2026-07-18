import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getLeadNotifySettings, upsertLeadNotifySettings } from "@/lib/leads/notify-settings";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const s = await getLeadNotifySettings(session.user.id);
  return NextResponse.json({
    email_enabled: s.email_enabled,
    webhook_enabled: s.webhook_enabled,
    webhook_url: s.webhook_url,
    hasSecret: !!s.webhook_secret,
  });
}

export async function PUT(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const body = await request.json().catch(() => ({}));
  const url = typeof body.webhook_url === "string" && body.webhook_url.trim() ? body.webhook_url.trim() : null;
  if (url && !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: ApiErrors.BAD_REQUEST }, { status: 400 });
  }
  const s = await upsertLeadNotifySettings(session.user.id, {
    email_enabled: body.email_enabled !== false,
    webhook_enabled: body.webhook_enabled === true,
    webhook_url: url,
  });
  return NextResponse.json({
    email_enabled: s.email_enabled,
    webhook_enabled: s.webhook_enabled,
    webhook_url: s.webhook_url,
    hasSecret: !!s.webhook_secret,
    secret: s.webhook_secret,
  });
}
