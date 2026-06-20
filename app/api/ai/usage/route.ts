import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { ApiErrors } from "@/lib/constants";
import { getUserPlan } from "@/lib/plans-db";
import pool from "@/lib/db";
import { buildUsageSummary } from "@/lib/ai/usage-summary";

async function monthCount(userId: string, kind: "page" | "rewrite"): Promise<number> {
  const r = await pool.query(
    `SELECT count(*)::int AS c FROM ai_usage
     WHERE user_id = $1 AND kind = $2 AND created_at >= date_trunc('month', now())`,
    [userId, kind],
  );
  return Number(r.rows[0]?.c ?? 0);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }
  const userId = session.user.id;
  const [plan, pageUsed, rewriteUsed, creditRow] = await Promise.all([
    getUserPlan(userId),
    monthCount(userId, "page"),
    monthCount(userId, "rewrite"),
    pool.query(`SELECT ai_credit_balance FROM users WHERE id = $1`, [userId]),
  ]);
  const creditBalance = Number(creditRow.rows[0]?.ai_credit_balance ?? 0);
  return NextResponse.json(buildUsageSummary({ plan, pageUsed, rewriteUsed, creditBalance }));
}
