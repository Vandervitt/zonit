import { after } from "next/server";
import pool from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { normalizeEmail } from "@/lib/auth/otp";
import { recordMilestone } from "@/lib/platform-milestones";
import { signupCompGrant, type PlanId } from "@/lib/plans";

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
 * - 不存在：写入赠送档（有邀请 token 则用邀请权益，否则默认注册赠送），建号并调度欢迎邮件。
 *
 * 注意：邀请 token 只在**建号**时生效。已注册邮箱带 token 登录会走上面的早退分支，
 * token 被完全忽略——所以给老用户补权益必须用超管赠送，不能靠重发邀请。
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

    // 新用户：处理可选邀请 token。
    let invite: { plan: PlanId; durationDays: number } | null = null;
    let invitationId: string | null = null;
    if (opts.token) {
      const inviteRes = await client.query(
        "SELECT * FROM invitations WHERE token = $1 AND expires_at > NOW() AND accepted_at IS NULL",
        [opts.token],
      );
      const invitation = inviteRes.rows[0];
      if (invitation) {
        invitationId = invitation.id;
        invite = { plan: invitation.plan as PlanId, durationDays: invitation.duration_days };
      }
    }

    // 赠送档一律走 comp_plan：邀请存在则覆盖默认的「注册即赠 Pro 7 天」，
    // 否则用默认赠送（见 signupCompGrant）。
    // plan（付费档）恒为 free —— 邀请权益绝不写付费档，否则受邀用户会被计入
    // 付费统计并污染计费页展示。trial_expires_at 属旧试用机制，新用户不再写入
    // （auth.ts 中的到期降级分支仅为存量行保留）。
    const grant = signupCompGrant(invite);
    const inserted = await client.query(
      `INSERT INTO users (email, name, plan, trial_expires_at, invited_at, email_verified, comp_plan, comp_plan_expires_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7)
       RETURNING id, email, name, image`,
      [email, null, "free", null, invitationId ? new Date() : null, grant.plan, grant.expiresAt],
    );

    if (invitationId) {
      await client.query(
        "UPDATE invitations SET accepted_at = NOW() WHERE id = $1",
        [invitationId],
      );
    }

    await client.query("COMMIT");

    const u = inserted.rows[0];
    await recordMilestone(u.id, "signup");

    // 新用户发欢迎邮件（best-effort，绝不阻断登录；未配置 Resend 自动跳过）。
    try {
      after(async () => {
        try {
          const appUrl = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
          // 欢迎邮件不传 locale，走默认语言：新用户的 users.locale 恒为 NULL
          // （建号路径刻意不写这一列，见 docs/feat_20260805_admin端国际化/design.md），
          // 而这里在 after() 里跑，也读不到请求的 zb_locale cookie。
          // 要按注册来源发欢迎邮件，得先把 locale 写进建号事务——那是另一件事。
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
