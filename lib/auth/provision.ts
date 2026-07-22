import { after } from "next/server";
import pool from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/auth/otp";

export type ProvisionedUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  disabled: boolean;
};

/**
 * 按邮箱 find-or-create 用户，供免密 OTP 登录使用。
 * - 已存在：直接返回（含 disabled 标记，交由调用方拒绝禁用账号）。
 * - 不存在：可选套用邀请 token 的套餐/试用期，建号并调度欢迎邮件。
 * 全程单事务，避免并发下重复建号。
 */
export async function provisionUserByEmail(
  rawEmail: string,
  opts: { token?: string | null } = {},
): Promise<ProvisionedUser> {
  const email = normalizeEmail(rawEmail);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query(
      "SELECT id, email, name, image, disabled_at FROM users WHERE email = $1",
      [email],
    );
    if (existing.rows.length > 0) {
      await client.query("COMMIT");
      const u = existing.rows[0];
      return {
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        image: u.image ?? null,
        disabled: Boolean(u.disabled_at),
      };
    }

    // 新用户：处理可选邀请 token（套餐 + 试用期）。
    let userPlan = "free";
    let trialExpiresAt: Date | null = null;
    let invitationId: string | null = null;
    if (opts.token) {
      const inviteRes = await client.query(
        "SELECT * FROM invitations WHERE token = $1 AND expires_at > NOW() AND accepted_at IS NULL",
        [opts.token],
      );
      const invitation = inviteRes.rows[0];
      if (invitation) {
        userPlan = invitation.plan;
        invitationId = invitation.id;
        const expiry = new Date();
        expiry.setDate(expiry.getDate() + invitation.duration_days);
        trialExpiresAt = expiry;
      }
    }

    const inserted = await client.query(
      `INSERT INTO users (email, name, plan, trial_expires_at, invited_at, email_verified)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, email, name, image`,
      [email, null, userPlan, trialExpiresAt, invitationId ? new Date() : null],
    );

    if (invitationId) {
      await client.query(
        "UPDATE invitations SET accepted_at = NOW() WHERE id = $1",
        [invitationId],
      );
    }

    await client.query("COMMIT");

    const u = inserted.rows[0];

    // 新用户发欢迎邮件（best-effort，绝不阻断登录；未配置 Resend 自动跳过）。
    try {
      after(async () => {
        try {
          const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
          await sendWelcomeEmail({ to: u.email, name: u.name ?? null, appUrl });
        } catch (err) {
          console.error("welcome email (otp) failed:", err);
        }
      });
    } catch (err) {
      console.error("welcome email (otp) schedule failed:", err);
    }

    return {
      id: u.id,
      email: u.email,
      name: u.name ?? null,
      image: u.image ?? null,
      disabled: false,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
