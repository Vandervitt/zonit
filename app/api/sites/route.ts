import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getSitesLimit } from "@/lib/plans";
import { getUserPlan, getUserSiteCount } from "@/lib/plans-db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT * FROM sites WHERE user_id = $1 ORDER BY updated_at DESC",
    [session.user.id],
  );
  return NextResponse.json(result.rows);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id, name, templateId, data } = await request.json();

  const [plan, siteCount] = await Promise.all([
    getUserPlan(session.user.id),
    getUserSiteCount(session.user.id),
  ]);
  if (siteCount >= getSitesLimit(plan)) {
    return NextResponse.json({ error: ApiErrors.QUOTA_EXCEEDED }, { status: 403 });
  }

  const existing = await pool.query(
    "SELECT id FROM sites WHERE user_id = $1 AND name = $2",
    [session.user.id, name],
  );
  if (existing.rows.length > 0) {
    return NextResponse.json({ error: ApiErrors.SITE_NAME_EXISTS }, { status: 409 });
  }

  const result = await pool.query(
    `INSERT INTO sites (id, user_id, name, template_id, data)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [id, session.user.id, name, templateId, JSON.stringify(data)],
  );
  return NextResponse.json(result.rows[0], { status: 201 });
}
