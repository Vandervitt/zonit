import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Zonit <onboarding@resend.dev>';

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
