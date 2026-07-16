import { NextResponse } from "next/server";
import pool from "@/lib/db";

// 供 uptime 探针探活：验证进程存活 + 数据库连通性。
// 永不缓存，否则探针会拿到过期结果。
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

export async function GET() {
  const startedAt = Date.now();
  try {
    await pool.query("SELECT 1");
    return NextResponse.json(
      { status: "ok", db: "up", latencyMs: Date.now() - startedAt },
      { status: 200, headers: NO_STORE },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", db: "down" },
      { status: 503, headers: NO_STORE },
    );
  }
}
