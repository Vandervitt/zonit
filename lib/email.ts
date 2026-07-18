import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Zonit <onboarding@resend.dev>';

/** HTML 转义：邮件正文插入不可信内容（如公开留资字段）前必须转义，防 HTML 注入。 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export async function sendInvitationEmail({ 
  to, 
  token, 
  plan = 'Pro', 
  days = 15 
}: { 
  to: string, 
  token: string, 
  plan?: string, 
  days?: number 
}) {
  if (!resend) {
    console.error('RESEND_API_KEY is not configured');
    return { error: 'Email service not configured' };
  }

  const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `您收到一份来自 Zonit 的专属邀请`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">欢迎加入 Zonit</h2>
          <p>您已被邀请加入 Zonit 平台，并获得以下专属权益：</p>
          <div style="background: #f4f4f4; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 0; font-weight: bold; color: #0070f3;">🎁 权益内容：${plan} 会员资格</p>
            <p style="margin: 5px 0 0 0; color: #666;">⏳ 试用时长：${days} 天</p>
          </div>
          <p>请点击下方按钮完成注册并领取您的权益：</p>
          <a href="${inviteUrl}" style="display: inline-block; background: #0070f3; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">立即注册领取</a>
          <p style="font-size: 12px; color: #999; margin-top: 30px;">
            此链接 24 小时内有效。如果您没有请求此邀请，请忽略此邮件。
          </p>
        </div>
      `,
    });

    return { success: true, data };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return { error };
  }
}

export async function sendLeadNotificationEmail({
  to, pageName, fields, dashboardUrl,
}: {
  to: string;
  pageName: string;
  fields: Record<string, unknown>;
  dashboardUrl: string;
}) {
  if (!resend) { console.error("RESEND_API_KEY is not configured"); return { error: "not_configured" }; }
  const rows = Object.entries(fields)
    .filter(([, v]) => typeof v === "string" && v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(k)}</td><td style="padding:4px 0;color:#111;">${escapeHtml(String(v))}</td></tr>`)
    .join("");
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `🎯 新线索 · ${pageName}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 4px;">收到一条新线索</h2>
          <p style="color:#666;margin:0 0 16px;">来自落地页：<strong>${escapeHtml(pageName)}</strong></p>
          <table style="border-collapse:collapse;font-size:14px;">${rows || '<tr><td style="color:#999;">（无字段）</td></tr>'}</table>
          <p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:#0070f3;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">在后台查看</a></p>
          <p style="font-size:12px;color:#999;margin-top:24px;">你可在「设置 → 线索通知」关闭此邮件。</p>
        </div>`,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send lead notification email:", error);
    return { error };
  }
}
