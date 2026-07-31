import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { validateLeadSubmission } from "@/lib/leads/validate";
import { leadRateLimiter } from "@/lib/leads/rate-limit";
import { isBadPageIdError } from "@/lib/db-errors";
import { insertLead, listLeads } from "@/lib/leads/store";
import { spoolLead } from "@/lib/leads/spool";
import { enqueueCapiEvents } from "@/lib/capi/dispatch";
import { notifyNewLead } from "@/lib/leads/notify";
import { recordFirstLeadMilestone } from "@/lib/platform-milestones";

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
  const attr = {
    channel: cap(body.channel, 32) ?? "form",
    utm_source: cap(utm.utm_source, 128),
    utm_medium: cap(utm.utm_medium, 128),
    utm_campaign: cap(utm.utm_campaign, 128),
  };
  try {
    await insertLead(pageId, result.payload, attr);
  } catch (err) {
    // 坏 page_id：线索无处可归，重投也永远失败 → 保持静默丢弃。
    if (isBadPageIdError(err)) return new NextResponse(null, { status: 204, headers: CORS });
    // 其余（连接中断、池打满、超时……）是真实故障：留证据、进兜底、让访客看到失败可重试，
    // 绝不再返回假成功——客户已经为这次点击付过广告费。
    console.error("[api/leads] 落库失败:", err);
    Sentry.captureException(err, { tags: { route: "api/leads", stage: "insert" }, extra: { pageId } });
    try {
      await spoolLead({ pageId, payload: result.payload, attr, spooledAt: new Date().toISOString() });
    } catch (spoolErr) {
      console.error("[api/leads] 兜底留存失败:", spoolErr);
      Sentry.captureException(spoolErr, { tags: { route: "api/leads", stage: "spool" }, extra: { pageId } });
    }
    return NextResponse.json({ error: "lead_store_failed" }, { status: 503, headers: CORS });
  }

  // 里程碑：线索已落库，此处失败不得影响提交结果
  try {
    await recordFirstLeadMilestone(pageId);
  } catch (err) {
    console.error("[api/leads] 里程碑记录失败:", err);
    Sentry.captureException(err, { tags: { route: "api/leads", stage: "milestone" }, extra: { pageId } });
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
  } catch (err) {
    // CAPI 入队失败：不影响线索提交，但必须留下证据（历史上这里是全空 catch）
    console.error("[api/leads] CAPI 入队失败:", err);
    Sentry.captureException(err, { tags: { route: "api/leads", stage: "capi" }, extra: { pageId } });
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
  } catch (err) {
    // 通知失败：不阻塞 204（线索已落库），但必须留下证据
    console.error("[api/leads] 线索通知失败:", err);
    Sentry.captureException(err, { tags: { route: "api/leads", stage: "notify" }, extra: { pageId } });
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
