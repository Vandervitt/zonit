import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { validateLeadSubmission } from "@/lib/leads/validate";
import { allowRequest, bucketKey } from "@/lib/rate-limit-db";
import { checkPublicOrigin } from "@/lib/leads/origin-guard";
import { isBadPageIdError } from "@/lib/db-errors";
import { insertLead, listLeads, countLeads } from "@/lib/leads/store";
import { spoolLead } from "@/lib/leads/spool";
import { enqueueCapiEvents } from "@/lib/capi/dispatch";
import { notifyNewLead } from "@/lib/leads/notify";
import { recordFirstLeadMilestone } from "@/lib/platform-milestones";

const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;

/** 访客留资限频：同 IP 每分钟 5 条。落库计数，跨实例共享（见 lib/rate-limit-db.ts）。 */
const RATE_LIMIT = { windowMs: 60_000, max: 5 };

/**
 * CORS 头。通过来源校验时**回显该来源**而不再是 `*`——
 * `*` 等于允许任意页面向任意 pageId 灌线索。
 * echo 为 null 时不下发 ACAO（同源请求本就不需要）。
 */
const cors = (echo: string | null): Record<string, string> => ({
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
  ...(echo ? { "Access-Control-Allow-Origin": echo } : {}),
});

/** 预检拿不到请求体，无从判定 pageId，故只回显来源；真正的授权在 POST 里做。 */
export function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

/** 公开提交（无登录）。 */
export async function POST(request: NextRequest) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: cors(null) });
  }
  // honeypot：机器人填了隐藏字段 → 静默丢弃
  if (typeof body.company_url === "string" && body.company_url.trim() !== "") {
    return new NextResponse(null, { status: 204, headers: cors(null) });
  }
  // 频率限制（同 IP，跨实例）
  const ip = (request.headers.get("x-forwarded-for") ?? "").split(",")[0].trim() || "unknown";
  if (!(await allowRequest(bucketKey("leads", ip), RATE_LIMIT))) {
    return NextResponse.json({ error: "rate_limited" }, { status: 429, headers: cors(null) });
  }
  const pageId = typeof body.pageId === "string" ? body.pageId : "";
  if (!pageId) return NextResponse.json({ error: "bad_payload" }, { status: 400, headers: cors(null) });

  // 来源校验：Origin 存在但不属于这个页面 → 拒。挡的是「向别人的页面灌线索」。
  const originCheck = await checkPublicOrigin(pageId, request.headers.get("origin"));
  if (!originCheck.allowed) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403, headers: cors(null) });
  }
  const echo = originCheck.echo;

  const fields = (body.fields && typeof body.fields === "object" ? body.fields : {}) as Record<string, unknown>;
  const result = validateLeadSubmission(fields);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400, headers: cors(null) });

  const utm = (body.utm && typeof body.utm === "object" ? body.utm : {}) as Record<string, unknown>;
  const attr = {
    channel: cap(body.channel, 32) ?? "form",
    utm_source: cap(utm.utm_source, 128),
    utm_medium: cap(utm.utm_medium, 128),
    utm_campaign: cap(utm.utm_campaign, 128),
    utm_term: cap(utm.utm_term, 128),
    utm_content: cap(utm.utm_content, 128),
    // 点击 ID 比 UTM 长得多（gclid 常超 100 字符），单独放宽上限，截断即失去对账价值。
    gclid: cap(utm.gclid, 512),
    fbclid: cap(utm.fbclid, 512),
    ttclid: cap(utm.ttclid, 512),
  };
  let leadId: string;
  try {
    leadId = await insertLead(pageId, result.payload, attr);
  } catch (err) {
    // 坏 page_id：线索无处可归，重投也永远失败 → 保持静默丢弃。
    if (isBadPageIdError(err)) return new NextResponse(null, { status: 204, headers: cors(echo) });
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
    return NextResponse.json({ error: "lead_store_failed" }, { status: 503, headers: cors(echo) });
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
      leadId,
      fields: result.payload as unknown as Record<string, unknown>,
      channel: cap(body.channel, 32) ?? "form",
      utm: attr,
      createdAt: new Date().toISOString(),
      dashboardUrl: `${origin}/admin/leads`,
    });
  } catch (err) {
    // 通知失败：不阻塞 204（线索已落库），但必须留下证据
    console.error("[api/leads] 线索通知失败:", err);
    Sentry.captureException(err, { tags: { route: "api/leads", stage: "notify" }, extra: { pageId } });
  }

  return new NextResponse(null, { status: 204, headers: cors(echo) });
}

/** 后台列表（登录）。 */
export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  const { searchParams } = request.nextUrl;
  const pageId = searchParams.get("pageId") ?? undefined;
  const unreadOnly = searchParams.get("unreadOnly") === "1";
  // 分页是必需的而不是优化：线索只增不减，跑久了的账号一次全量拉取会拖垮列表。
  const limit = Math.min(Math.max(Number(searchParams.get("limit") ?? 50) || 50, 1), 200);
  const offset = Math.max(Number(searchParams.get("offset") ?? 0) || 0, 0);
  const filter = { pageId, unreadOnly };
  const [rows, total] = await Promise.all([
    listLeads(session.user.id, { ...filter, limit, offset }),
    countLeads(session.user.id, filter),
  ]);
  return NextResponse.json({ rows, total });
}
