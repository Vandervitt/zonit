import { NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import pool from "@/lib/db";
import { isBadPageIdError } from "@/lib/db-errors";
import { checkPublicOrigin } from "@/lib/leads/origin-guard";

const EVENTS = new Set(["page_view", "cta_click"]);
const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;

/** 与 /api/leads 同口径：通过校验才回显来源，不再对任意站点开放。 */
const cors = (echo: string | null): Record<string, string> => ({
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  Vary: "Origin",
  ...(echo ? { "Access-Control-Allow-Origin": echo } : {}),
});

export function OPTIONS(request: Request) {
  return new NextResponse(null, { status: 204, headers: cors(request.headers.get("origin")) });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: cors(null) });
  }
  const pageId = typeof body.pageId === "string" ? body.pageId : "";
  const event = typeof body.event === "string" ? body.event : "";
  if (!pageId || !EVENTS.has(event)) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400, headers: cors(null) });
  }
  // 来源校验：挡住往别人页面灌埋点（会污染客户的漏斗数据）。解析结果有实例内缓存，
  // 这是每次 page_view 都会走的热路径。
  const originCheck = await checkPublicOrigin(pageId, request.headers.get("origin"));
  if (!originCheck.allowed) {
    return NextResponse.json({ error: "forbidden_origin" }, { status: 403, headers: cors(null) });
  }
  try {
    await pool.query(
      `INSERT INTO analytics_events (page_id, event, channel, utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, event, cap(body.channel, 32), cap(body.utm_source, 128), cap(body.utm_medium, 128), cap(body.utm_campaign, 128)],
    );
  } catch (err) {
    // 坏 page_id：静默忽略。其余（连接中断、池打满等）不阻塞埋点响应，
    // 但必须留证据——埋点静默失败会让漏斗数据凭空缩水且无人察觉。
    if (!isBadPageIdError(err)) {
      console.error("[api/track] 埋点落库失败:", err);
      Sentry.captureException(err, { tags: { route: "api/track" }, extra: { pageId, event } });
    }
  }
  return new NextResponse(null, { status: 204, headers: cors(originCheck.echo) });
}
