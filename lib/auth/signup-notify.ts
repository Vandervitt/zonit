import { sendSignupNotificationEmail, type SignupSource } from "@/lib/email";
import { getSuperAdminRecipients } from "@/lib/super-admin/notify-recipients";
import { Routes } from "@/lib/constants";

/**
 * 新用户建号后通知超管。best-effort：绝不阻断注册/登录，未配置 Resend 或无收件人时自动跳过。
 * 两条建号路径（OTP 免密、Google 首登）共用此出口。
 */
export async function notifyAdminsOfSignup(params: {
  email: string;
  name?: string | null;
  source: SignupSource;
  plan?: string | null;
}): Promise<void> {
  try {
    const to = await getSuperAdminRecipients();
    if (to.length === 0) return;
    const base = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "";
    await sendSignupNotificationEmail({
      ...params,
      to,
      dashboardUrl: `${base}${Routes.SuperAdmin}/users`,
    });
  } catch (err) {
    console.error("signup notification failed:", err);
  }
}
