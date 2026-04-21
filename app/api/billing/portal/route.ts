import { NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { ApiErrors } from "@/lib/constants";
import { getPortalUrl } from "@/lib/lemonsqueezy";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const result = await pool.query(
    "SELECT ls_customer_id FROM users WHERE id = $1",
    [session.user.id],
  );
  const lsCustomerId = result.rows[0]?.ls_customer_id as string | undefined;

  if (!lsCustomerId) {
    return NextResponse.json({ error: "No active subscription" }, { status: 404 });
  }

  try {
    const portalUrl = await getPortalUrl(lsCustomerId);
    return NextResponse.json({ portalUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
