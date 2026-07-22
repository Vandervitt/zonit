import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY 
  ? new Resend(process.env.RESEND_API_KEY) 
  : null;

const FROM_EMAIL = process.env.EMAIL_FROM || 'Zap Bridge <onboarding@resend.dev>';

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
      subject: `您收到一份来自 Zap Bridge 的专属邀请`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #333;">欢迎加入 Zap Bridge</h2>
          <p>您已被邀请加入 Zap Bridge 平台，并获得以下专属权益：</p>
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

export async function sendOtpEmail({
  to, code,
}: {
  to: string;
  code: string;
}) {
  if (!resend) { console.error("RESEND_API_KEY is not configured"); return { error: "not_configured" }; }
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `Zap Bridge 登录验证码：${code}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 8px;">登录验证码</h2>
          <p style="color:#555;margin:0 0 20px;">使用以下验证码登录 Zap Bridge。验证码 10 分钟内有效，请勿泄露给他人。</p>
          <div style="background:#f7f9fc;padding:20px;border-radius:8px;text-align:center;margin:0 0 20px;">
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:#0070f3;">${escapeHtml(code)}</span>
          </div>
          <p style="font-size:13px;color:#888;margin:0;">如果你没有尝试登录，请忽略这封邮件，你的账号是安全的。</p>
        </div>`,
    });
    // Resend SDK 不抛错，API 层错误经 error 字段返回：显式暴露，避免静默失败。
    if (error) { console.error("Failed to send OTP email:", error); return { error }; }
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return { error };
  }
}

export async function sendWelcomeEmail({
  to, name, appUrl,
}: {
  to: string;
  name?: string | null;
  appUrl: string;
}) {
  if (!resend) { console.error("RESEND_API_KEY is not configured"); return { error: "not_configured" }; }
  const greeting = name ? escapeHtml(name) : "你好";
  const startUrl = `${appUrl}/admin/landing-pages`;
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `欢迎加入 Zap Bridge，3 步上线你的第一张获客落地页`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 8px;">欢迎，${greeting} 👋</h2>
          <p style="color:#555;margin:0 0 20px;">Zap Bridge 帮你不写代码、几分钟做出一张能跑广告、能收线索的出海落地页。三步就能跑通：</p>
          <div style="background:#f7f9fc;padding:16px 18px;border-radius:8px;margin:0 0 20px;">
            <p style="margin:0 0 10px;color:#111;"><strong>1. 建页</strong> —— 选行业模板，或 AI 一句话生成整页</p>
            <p style="margin:0 0 10px;color:#111;"><strong>2. 绑定域名</strong> —— 发布到你自己的品牌域名，投放更可信</p>
            <p style="margin:0;color:#111;"><strong>3. 开投收客</strong> —— 配好像素，收 WhatsApp / 表单线索</p>
          </div>
          <a href="${startUrl}" style="display:inline-block;background:#0070f3;color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;font-weight:bold;">开始建页</a>
          <p style="font-size:13px;color:#888;margin-top:28px;">遇到任何问题，直接回复这封邮件，或在后台侧边栏点「联系创始人」找我。祝出单顺利 🚀</p>
        </div>`,
    });
    // Resend SDK 不抛错，API 层错误经 error 字段返回：显式暴露，避免静默失败。
    if (error) { console.error("Failed to send welcome email:", error); return { error }; }
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send welcome email:", error);
    return { error };
  }
}

export async function sendFeedbackNotificationEmail({
  to, source, message, meta, dashboardUrl,
}: {
  to: string;
  source: string;
  message: string;
  meta: Record<string, string | undefined>;
  dashboardUrl: string;
}) {
  if (!resend) { console.error("RESEND_API_KEY is not configured"); return { error: "not_configured" }; }
  const rows = Object.entries(meta)
    .filter(([, v]) => typeof v === "string" && v)
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666;">${escapeHtml(k)}</td><td style="padding:4px 0;color:#111;">${escapeHtml(String(v))}</td></tr>`)
    .join("");
  try {
    const data = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `💬 新用户反馈 · ${escapeHtml(source)}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 12px;">收到一条用户反馈</h2>
          <div style="background:#f4f4f4;padding:15px;border-radius:5px;margin:0 0 16px;color:#111;white-space:pre-wrap;">${escapeHtml(message)}</div>
          <table style="border-collapse:collapse;font-size:13px;">${rows}</table>
          <p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:#0070f3;color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">在超管收件箱查看</a></p>
        </div>`,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send feedback notification email:", error);
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
