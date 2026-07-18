import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { validateLeadSubmission } from "@/lib/leads/validate";
import { leadRateLimiter } from "@/lib/leads/rate-limit";
import { insertLead, listLeads } from "@/lib/leads/store";
import { enqueueCapiEvents } from "@/lib/capi/dispatch";
import { notifyNewLead } from "@/lib/leads/notify";

const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/** 公开提交（无登录）。 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: CORS });
  }
  // honeypot：机器人填了隐藏字段 → 静默丢弃
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return new NextResponse(null, { status: 204, headers: CORS });
  }
  // 频率限制（同 IP）
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!leadRateLimiter.allow(ip)) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: CORS });
  }
  const pageId = typeof body.pageId === "string" ? body.pageId : "";
  if (!pageId) return NextResponse.json({ error: "bad_payload" }, { status: 400, headers: CORS });

  const fields = (body.fields && typeof body.fields === "object" ? body.fields : {}) as Record<string, unknown>;
  const result = validateLeadSubmission(fields);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers: CORS });

  const utm = (body.utm && typeof body.utm === "object" ? body.utm : {}) as Record<string, unknown>;
  try {
    await insertLead(pageId, result.payload, {
      channel: cap(body.channel, 32) ?? "form",
      utm_source: cap(utm.utm_source, 128),
      utm_medium: cap(utm.utm_medium, 128),
      utm_campaign: cap(utm.utm_campaign, 128),
    });
  } catch {
    // 坏 page_id 等 FK 错误：best-effort 忽略
  }

  // CAPI：表单转化服务端回传（失败不影响 lead 提交）
  try {
    await enqueueCapiEvents(pageId, {
      email: typeof result.payload.email === "string" ? result.payload.email : undefined,
      phone: typeof result.payload.phone === "string" ? result.payload.phone : undefined,
      eventId: cap(body.event_id, 64) ?? "",
      fbp: cap(body.fbp, 256) ?? undefined,
      fbc: cap(body.fbc, 256) ?? undefined,
      ttp: cap(body.ttp, 256) ?? undefined,
      ttclid: cap(body.ttclid, 256) ?? undefined,
      clientIp: ip !== "unknown" ? ip : undefined,
      userAgent: request.headers.get("user-agent") ?? undefined,
      sourceUrl: cap(body.source_url, 512) ?? undefined,
      consent: body.consent !== false, // 默认允许；客户端显式 false 才跳过
    });
  } catch {
    // CAPI 入队失败：best-effort 忽略，不影响线索提交
  }

  // 线索通知（邮件 + webhook）：best-effort，失败不影响线索提交
  try {
    const origin = new URL(request.url).origin;
    await notifyNewLead({
      pageId,
      fields: result.payload as unknown as Record<string, unknown>,
      channel: cap(body.channel, 32) ?? "form",
      utm: { utm_source: cap(utm.utm_source, 128), utm_medium: cap(utm.utm_medium, 128), utm_campaign: cap(utm.utm_campaign, 128) },
      createdAt: new Date().toISOString(),
      dashboardUrl: `${origin}/admin/leads`,
    });
  } catch {
    // 通知失败：忽略，不阻塞 204
  }

  return new NextResponse(null, { status: 204, headers: CORS });
}

/** 后台列表（登录）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { searchParams } = request.nextUrl;
  const pageId = searchParams.get("pageId") ?? undefined;
  const unreadOnly = searchParams.get("unreadOnly") === "1";
  const rows = await listLeads(session.user.id, { pageId, unreadOnly });
  return NextResponse.json(rows);
}
