import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { SiteStatus } from "@/lib/constants";

export async function GET(_req: NextRequest, ctx: RouteContext<"/api/sites/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const result = await pool.query(
    "SELECT * FROM sites WHERE id = $1 AND user_id = $2",
    [id, session.user.id],
  );
  if (!result.rows[0]) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function PUT(request: NextRequest, ctx: RouteContext<"/api/sites/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const body = await request.json();
  const { name, data, published, slug } = body;

  if (slug !== undefined) {
    const conflict = await pool.query(
      "SELECT id FROM sites WHERE slug = $1 AND id != $2",
      [slug, id],
    );
    if (conflict.rows.length > 0) {
      return NextResponse.json({ error: ApiErrors.SLUG_TAKEN }, { status: 409 });
    }
  }

  const setClauses: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let idx = 1;

  if (name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(name);
  }
  if (data !== undefined) {
    setClauses.push(`data = $${idx++}`);
    values.push(JSON.stringify(data));
  }
  if (slug !== undefined) {
    setClauses.push(`slug = $${idx++}`);
    values.push(slug);
  }
  if (published !== undefined) {
    const status = published ? SiteStatus.Published : SiteStatus.Draft;
    setClauses.push(`status = $${idx++}`);
    values.push(status);
    if (published) {
      setClauses.push("published_at = COALESCE(published_at, NOW())");
    }
  }

  values.push(id, session.user.id);
  const result = await pool.query(
    `UPDATE sites SET ${setClauses.join(", ")} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
    values,
  );
  if (!result.rows[0]) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }
  return NextResponse.json(result.rows[0]);
}

export async function DELETE(_req: NextRequest, ctx: RouteContext<"/api/sites/[id]">) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { id } = await ctx.params;
  const result = await pool.query(
    "DELETE FROM sites WHERE id = $1 AND user_id = $2 RETURNING id",
    [id, session.user.id],
  );
  if (!result.rows[0]) {
    return NextResponse.json({ error: ApiErrors.NOT_FOUND }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
