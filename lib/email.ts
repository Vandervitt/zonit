import { Resend } from 'resend';
import { BRAND } from '@/lib/theme/brand';
import { PLANS, planEntitlementLines, planPriceLabel, type PlanId } from '@/lib/plans';
import { getUsdToCnyRate } from '@/lib/pricing/fx-server';

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

/** 邀请链接有效期的人类可读描述：≥24h 且整天时按天说，否则按小时。 */
export function formatLinkValidity(expiresAt: Date, now: Date = new Date()): string {
  const hours = Math.max(1, Math.round((expiresAt.getTime() - now.getTime()) / 3_600_000));
  if (hours >= 24 && hours % 24 === 0) return `${hours / 24} 天`;
  return `${hours} 小时`;
}

export async function sendInvitationEmail({
  to,
  token,
  plan = "pro",
  days = 15,
  expiresAt,
}: {
  to: string;
  token: string;
  plan?: PlanId | string;
  days?: number;
  /** 邀请链接失效时刻；邮件里的有效期文案由它渲染，不再写死。 */
  expiresAt: Date;
}) {
  if (!resend) {
    console.error('RESEND_API_KEY is not configured');
    return { error: 'Email service not configured' };
  }

  const inviteUrl = `${process.env.NEXTAUTH_URL}/register?token=${token}`;
  const planId = plan as PlanId;
  const planCfg = PLANS[planId];
  const planLabel = planCfg?.label ?? String(plan);
  const validity = formatLinkValidity(expiresAt);
  // 邀请邮件是中文面：美元价旁附人民币参考换算，收件人才有价格体感。
  const priceNote = planCfg && planCfg.priceAmount > 0
    ? `这档平时 ${planPriceLabel(planCfg, "zh", await getUsdToCnyRate())}`
    : "";

  // 权益清单从 PLANS 派生，套餐配置一改邮件自动跟着变（见 planEntitlementLines）。
  const entitlements = planCfg
    ? planEntitlementLines(planId, "zh")
        .map(
          (e) => `<tr>
            <td style="padding:5px 12px 5px 0;color:#555;">${escapeHtml(e.label)}</td>
            <td style="padding:5px 0;color:#111;font-weight:bold;text-align:right;white-space:nowrap;">${e.value ? escapeHtml(e.value) : "✓"}</td>
          </tr>`,
        )
        .join("")
    : "";

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `送你 ${days} 天 Zap Bridge ${planLabel}：一个下午做出能跑广告的获客落地页`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 12px;">一个下午，把你的获客落地页跑起来</h2>
          <p style="color:#555;margin:0 0 22px;line-height:1.75;">
            做海外获客，最拖后腿的常常不是投放，是那张落地页——找外包几千起步、来回等一周，
            改个标题还得再排一次期。<strong style="color:#111;">Zap Bridge 就是来终结这件事的。</strong>
          </p>

          <p style="color:#111;margin:0 0 10px;font-weight:bold;">三步，页面就能开始收线索</p>
          <div style="background:#f7f9fc;padding:18px 20px;border-radius:8px;margin:0 0 22px;line-height:1.75;">
            <p style="margin:0 0 14px;color:#111;">
              <strong>① 选模板，让 AI 把整页写成你的</strong><br />
              <span style="color:#555;">30+ 行业获客模板挑一套做骨架，填一段业务介绍，AI 顺着这套模板把标题、卖点、CTA 全部改写成你的内容，再到可视化编辑器里换字换图。全程不碰一行代码。</span>
            </p>
            <p style="margin:0 0 14px;color:#111;">
              <strong>② 发布到你自己的品牌域名</strong><br />
              <span style="color:#555;">平台直接算好你要加的那一条 DNS 记录，复制到域名商粘贴即可，HTTPS 证书自动签发、自动续期。自有域名投放过审更顺，客户看到的是你的品牌，而不是一眼就认出的第三方工具链接。</span>
            </p>
            <p style="margin:0;color:#111;">
              <strong>③ 线索接得住，广告费算得清</strong><br />
              <span style="color:#555;">WhatsApp 一键开聊、表单留资，线索自动归集到后台；像素、UTM 与服务端回传（CAPI）全都内置，填个凭据就能开，不用自己搭服务器。钱花在哪、换回了什么，一目了然。</span>
            </p>
          </div>

          <p style="color:#111;margin:0 0 4px;font-weight:bold;">
            这份邀请直接为你开通 ${escapeHtml(planLabel)}，整整 ${days} 天${priceNote ? `<span style="color:#888;font-weight:normal;font-size:13px;">（${escapeHtml(priceNote)}）</span>` : ""}
          </p>
          <p style="color:#888;font-size:13px;margin:0 0 12px;">以下是你这份邀请实际解锁的功能：</p>
          <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 8px;">${entitlements}</table>
          <p style="color:#888;font-size:13px;margin:0 0 24px;">权益从你完成注册那天才开始计时，不点开就不会白白流走。</p>

          <a href="${inviteUrl}" style="display:inline-block;background:${BRAND};color:#fff;padding:13px 26px;text-decoration:none;border-radius:5px;font-weight:bold;">接受邀请，开始搭页</a>

          <p style="font-size:13px;color:#888;margin-top:28px;line-height:1.7;">
            此邀请链接 ${validity}内有效，需用本邮箱（${escapeHtml(to)}）注册。<br />
            有任何问题，直接回复这封邮件就能找到我。<br />
            如果你没有申请过这份邀请，忽略即可。
          </p>
        </div>
      `,
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      return { error };
    }
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
            <span style="font-size:32px;font-weight:bold;letter-spacing:8px;color:${BRAND};">${escapeHtml(code)}</span>
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
          <a href="${startUrl}" style="display:inline-block;background:${BRAND};color:#fff;padding:12px 24px;text-decoration:none;border-radius:5px;font-weight:bold;">开始建页</a>
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
          <p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:${BRAND};color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">在超管收件箱查看</a></p>
        </div>`,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send feedback notification email:", error);
    return { error };
  }
}

export interface DigestEmailPage {
  name: string;
  views: number;
  ctaClicks: number;
  leads: number;
  viewsTrend: string;
  ctaTrend: string;
  leadsTrend: string;
}

export async function sendWeeklyDigestEmail({
  to, pages, dashboardUrl, settingsUrl,
}: {
  to: string;
  pages: DigestEmailPage[];
  dashboardUrl: string;
  settingsUrl: string;
}) {
  if (!resend) { console.error("RESEND_API_KEY is not configured"); return { error: "not_configured" }; }
  const totalLeads = pages.reduce((n, p) => n + p.leads, 0);
  const rows = pages
    .map(
      (p) => `<tr>
        <td style="padding:8px 12px 8px 0;color:#111;border-bottom:1px solid #f0f0f0;">${escapeHtml(p.name)}</td>
        <td style="padding:8px 12px;color:#111;text-align:right;border-bottom:1px solid #f0f0f0;">${p.views} <span style="color:#999;font-size:12px;">${escapeHtml(p.viewsTrend)}</span></td>
        <td style="padding:8px 12px;color:#111;text-align:right;border-bottom:1px solid #f0f0f0;">${p.ctaClicks} <span style="color:#999;font-size:12px;">${escapeHtml(p.ctaTrend)}</span></td>
        <td style="padding:8px 0 8px 12px;color:#111;text-align:right;border-bottom:1px solid #f0f0f0;"><strong>${p.leads}</strong> <span style="color:#999;font-size:12px;">${escapeHtml(p.leadsTrend)}</span></td>
      </tr>`,
    )
    .join("");
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `📈 本周获客周报：${totalLeads} 条新线索`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 4px;">本周获客周报</h2>
          <p style="color:#666;margin:0 0 20px;">过去 7 天你的已发布落地页表现（对比再上一周）：</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">
            <tr>
              <th style="padding:0 12px 8px 0;color:#666;text-align:left;font-weight:normal;">落地页</th>
              <th style="padding:0 12px 8px;color:#666;text-align:right;font-weight:normal;">曝光</th>
              <th style="padding:0 12px 8px;color:#666;text-align:right;font-weight:normal;">CTA 点击</th>
              <th style="padding:0 0 8px 12px;color:#666;text-align:right;font-weight:normal;">线索</th>
            </tr>
            ${rows}
          </table>
          <p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:${BRAND};color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">查看投放分析</a></p>
          <p style="font-size:12px;color:#999;margin-top:24px;">不想收周报？可在<a href="${settingsUrl}" style="color:#999;">「设置 → 线索通知」</a>关闭。</p>
        </div>`,
    });
    // Resend SDK 不抛错，API 层错误经 error 字段返回：显式暴露，避免静默失败。
    if (error) { console.error("Failed to send weekly digest email:", error); return { error }; }
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send weekly digest email:", error);
    return { error };
  }
}

export interface NudgeEmailLead {
  pageName: string;
  contact: string;
  waitedHours: number;
}

/**
 * 未读线索提醒：静置超 48h 且从未打开过的线索，每条只提醒一次（由 nudged_at 保证）。
 * 语气克制——这是提醒不是催促，且必须给关闭入口，否则提醒会变骚扰。
 */
export async function sendLeadNudgeEmail({
  to, leads, totalCount, dashboardUrl, settingsUrl,
}: {
  to: string;
  leads: NudgeEmailLead[];
  totalCount: number;
  dashboardUrl: string;
  settingsUrl: string;
}) {
  if (!resend) { console.error("RESEND_API_KEY is not configured"); return { error: "not_configured" }; }
  const rows = leads
    .map(
      (l) => `<tr>
        <td style="padding:8px 12px 8px 0;color:#111;border-bottom:1px solid #f0f0f0;">${escapeHtml(l.contact)}</td>
        <td style="padding:8px 12px;color:#666;border-bottom:1px solid #f0f0f0;">${escapeHtml(l.pageName)}</td>
        <td style="padding:8px 0 8px 12px;color:#111;text-align:right;border-bottom:1px solid #f0f0f0;">已等 ${l.waitedHours} 小时</td>
      </tr>`,
    )
    .join("");
  const more = totalCount > leads.length ? `<p style="color:#666;font-size:13px;margin:12px 0 0;">还有 ${totalCount - leads.length} 条未列出。</p>` : "";
  try {
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [to],
      subject: `⏰ ${totalCount} 条线索还没跟进`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #eee;border-radius:10px;">
          <h2 style="color:#111;margin:0 0 4px;">有线索还在等回复</h2>
          <p style="color:#666;margin:0 0 20px;">这些线索留资已超过 48 小时，还没有被打开过。越早联系，成交率越高。</p>
          <table style="border-collapse:collapse;width:100%;font-size:14px;">${rows}</table>
          ${more}
          <p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:${BRAND};color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">去跟进</a></p>
          <p style="font-size:12px;color:#999;margin-top:24px;">每条线索只提醒一次。不想收提醒？可在<a href="${settingsUrl}" style="color:#999;">「设置 → 线索通知」</a>关闭。</p>
        </div>`,
    });
    if (error) { console.error("Failed to send lead nudge email:", error); return { error }; }
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send lead nudge email:", error);
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
          <p style="margin-top:24px;"><a href="${dashboardUrl}" style="display:inline-block;background:${BRAND};color:#fff;padding:10px 20px;text-decoration:none;border-radius:5px;">在后台查看</a></p>
          <p style="font-size:12px;color:#999;margin-top:24px;">你可在「设置 → 线索通知」关闭此邮件。</p>
        </div>`,
    });
    return { success: true, data };
  } catch (error) {
    console.error("Failed to send lead notification email:", error);
    return { error };
  }
}
