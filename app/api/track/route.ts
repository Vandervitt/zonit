import { NextResponse } from "next/server";
import pool from "@/lib/db";

const EVENTS = new Set(["page_view", "cta_click"]);
const cap = (v: unknown, n: number): string | null =>
  typeof v === "string" && v.length > 0 ? v.slice(0, n) : null;

const CORS = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type" };

export function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return NextResponse.json({ error: "bad_json" }, { status: 400, headers: CORS });
  }
  const pageId = typeof body.pageId === "string" ? body.pageId : "";
  const event = typeof body.event === "string" ? body.event : "";
  if (!pageId || !EVENTS.has(event)) {
    return NextResponse.json({ error: "bad_payload" }, { status: 400, headers: CORS });
  }
  try {
    await pool.query(
      `INSERT INTO analytics_events (page_id, event, channel, utm_source, utm_medium, utm_campaign)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [pageId, event, cap(body.channel, 32), cap(body.utm_source, 128), cap(body.utm_medium, 128), cap(body.utm_campaign, 128)],
    );
  } catch {
    // 坏 page_id 触发 FK 错误等：best-effort 忽略
  }
  return new NextResponse(null, { status: 204, headers: CORS });
}
