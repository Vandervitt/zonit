import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { UserRole, ApiErrors } from "@/lib/constants";
import { sendInvitationEmail } from "@/lib/email";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();

  // 1. 权限检查
  if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const { email, plan = 'pro', duration_days = 15 } = await req.json();

  if (!email) {
    return NextResponse.json({ error: ApiErrors.FIELDS_REQUIRED }, { status: 400 });
  }

  try {
    // 2. 生成 Token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24小时有效

    // 3. 存入数据库
    await pool.query(
      `INSERT INTO invitations (email, token, plan, duration_days, invited_by, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [email, token, plan, duration_days, session.user.id, expiresAt]
    );

    // 4. 发送邮件
    const emailResult = await sendInvitationEmail({
      to: email,
      token,
      plan: plan.toUpperCase(),
      days: duration_days
    });

    if (emailResult.error) {
      return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, token });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
