import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import pool from "@/lib/db";
import { UserRole, ApiErrors } from "@/lib/constants";
import { sendInvitationEmail } from "@/lib/email";
import { PLANS, type PlanId } from "@/lib/plans";
import {
  normalizeInviteEmails,
  resolveLinkHours,
  MAX_INVITE_BATCH,
  type InviteResult,
} from "@/lib/invite/normalize";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  const session = await auth();

  if (!session || session.user.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json({ error: ApiErrors.UNAUTHORIZED }, { status: 401 });
  }

  const body = await req.json();
  const plan: PlanId = body.plan ?? "pro";
  const durationDays = Number(body.duration_days ?? 15);
  const linkHours = resolveLinkHours(body.link_expires_hours);

  if (!PLANS[plan]) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }
  if (!Number.isFinite(durationDays) || durationDays < 1 || durationDays > 365) {
    return NextResponse.json({ error: "Invalid duration_days" }, { status: 400 });
  }

  // 兼容旧的单邮箱字段，主路径走 emails[]。
  const { emails, skipped } = normalizeInviteEmails(body.emails ?? body.email);
  if (emails.length === 0 && skipped.length === 0) {
    return NextResponse.json({ error: ApiErrors.FIELDS_REQUIRED }, { status: 400 });
  }
  if (emails.length > MAX_INVITE_BATCH) {
    return NextResponse.json({ error: `一次最多邀请 ${MAX_INVITE_BATCH} 个邮箱` }, { status: 400 });
  }

  const result: InviteResult = { sent: [], skipped: [...skipped], failed: [] };

  try {
    // 已注册邮箱直接跳过：邀请 token 只在建号时生效（见 provisionUserByEmail），
    // 老用户点链接拿不到任何权益，发出去的邮件反而是误导。这类要改用超管赠送。
    if (emails.length > 0) {
      const existing = await pool.query<{ email: string }>(
        "SELECT email FROM users WHERE email = ANY($1::text[])",
        [emails],
      );
      const registered = new Set(existing.rows.map((r) => r.email));
      for (const email of emails) {
        if (registered.has(email)) {
          result.skipped.push({ email, reason: "already_registered" });
        }
      }
    }

    const targets = emails.filter(
      (e) => !result.skipped.some((s) => s.reason === "already_registered" && s.email === e),
    );

    // 逐封处理：一封失败不影响其余，最终按邮箱逐条回报，避免「声称全发成功」。
    for (const email of targets) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + linkHours * 3_600_000);
      try {
        await pool.query(
          `INSERT INTO invitations (email, token, plan, duration_days, invited_by, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [email, token, plan, durationDays, session.user.id, expiresAt],
        );
        const emailResult = await sendInvitationEmail({
          to: email,
          token,
          plan,
          days: durationDays,
          expiresAt,
        });
        if (emailResult.error) {
          result.failed.push({ email, reason: "邮件发送失败" });
        } else {
          result.sent.push(email);
        }
      } catch (err) {
        console.error("invite failed for", email, err);
        result.failed.push({ email, reason: "创建邀请失败" });
      }
    }

    return NextResponse.json({ ok: result.failed.length === 0, ...result });
  } catch (error) {
    console.error("Invite error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
