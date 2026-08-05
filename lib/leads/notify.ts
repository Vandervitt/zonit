// 线索通知编排：查 owner（email + 设置 + 套餐）→ 邮件（全档，开关+有邮箱）+ webhook（套餐允许+开关+URL）。
import pool from "@/lib/db";
import { after } from "next/server";
import { getUserPlan } from "@/lib/plans-db";
import { hasLeadWebhook } from "@/lib/plans";
import { sendLeadNotificationEmail } from "@/lib/email";
import { buildLeadWebhookPayload, type LeadWebhookInput } from "./webhook-payload";
import { insertDelivery } from "@/lib/webhooks/deliveries-store";
import { setLeadEmailNotify, setLeadWebhookDelivery } from "./store";
import { enqueueAndFlush } from "@/lib/webhooks/dispatch";

interface OwnerCtx {
  userId: string; email: string | null; locale: string | null; pageName: string;
  email_enabled: boolean; webhook_enabled: boolean; webhook_url: string | null;
}

async function getOwnerCtx(pageId: string): Promise<OwnerCtx | null> {
  const res = await pool.query(
    `SELECT p.user_id, p.name AS page_name, u.email, u.locale,
            COALESCE(s.email_enabled, TRUE) AS email_enabled,
            COALESCE(s.webhook_enabled, FALSE) AS webhook_enabled,
            s.webhook_url
       FROM landing_pages p
       JOIN users u ON u.id = p.user_id
       LEFT JOIN lead_notification_settings s ON s.user_id = p.user_id
      WHERE p.id = $1`,
    [pageId],
  );
  const r = res.rows[0];
  if (!r) return null;
  return {
    userId: r.user_id, email: r.email, locale: r.locale, pageName: r.page_name,
    email_enabled: r.email_enabled, webhook_enabled: r.webhook_enabled, webhook_url: r.webhook_url,
  };
}

/** Resend 的错误形态不固定（字符串 / Error / API 错误对象），统一压成一行可读文本。 */
function describeError(r: { error?: unknown }): string {
  const e = r.error;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e) return String((e as { message: unknown }).message);
  return "unknown_error";
}

export interface NotifyDecision { email: boolean; webhook: boolean }

/** 纯决策：邮件全档（开关 + 有邮箱）；webhook 需套餐允许 + 开关 + 有 URL。 */
export function decideNotify(ctx: {
  email: string | null; email_enabled: boolean;
  webhook_enabled: boolean; webhook_url: string | null; planAllowsWebhook: boolean;
}): NotifyDecision {
  return {
    email: ctx.email_enabled && !!ctx.email,
    webhook: ctx.planAllowsWebhook && ctx.webhook_enabled && !!ctx.webhook_url,
  };
}

export interface NewLeadInput {
  pageId: string;
  /** 线索行 id：通知结果回写到它上面，供后台展示送达可见性。 */
  leadId?: string;
  fields: Record<string, unknown>;
  channel: string | null;
  utm: LeadWebhookInput["utm"];
  createdAt: string;
  dashboardUrl: string;
}

/** best-effort：任何失败只记录，不抛给调用方（不阻塞线索 204）。 */
export async function notifyNewLead(input: NewLeadInput): Promise<void> {
  const ctx = await getOwnerCtx(input.pageId);
  if (!ctx) return;
  const decision = decideNotify({
    email: ctx.email, email_enabled: ctx.email_enabled,
    webhook_enabled: ctx.webhook_enabled, webhook_url: ctx.webhook_url,
    planAllowsWebhook: hasLeadWebhook(await getUserPlan(ctx.userId)),
  });

  const leadId = input.leadId;

  if (decision.email && ctx.email) {
    const to = ctx.email;
    const locale = ctx.locale;
    // 邮件在响应之后发（不占访客等待），故结果也在这里回写。
    after(async () => {
      const r = await sendLeadNotificationEmail({
        to, pageName: ctx.pageName, fields: input.fields, dashboardUrl: input.dashboardUrl, locale,
      });
      if (!leadId) return;
      const ok = "success" in r && r.success;
      await setLeadEmailNotify(leadId, ok ? "sent" : "failed", ok ? undefined : describeError(r));
    });
  } else if (leadId) {
    // 关了开关或没邮箱：明确记成 off，与「发失败」区分开——
    // 否则客户看到空白，分不清是平台没发还是发了没到。
    await setLeadEmailNotify(leadId, "off");
  }

  if (decision.webhook) {
    const payload = buildLeadWebhookPayload({
      pageId: input.pageId, pageName: ctx.pageName, fields: input.fields,
      channel: input.channel, utm: input.utm, createdAt: input.createdAt,
    });
    const id = await insertDelivery({ userId: ctx.userId, pageId: input.pageId, payload: payload as unknown as Record<string, unknown> });
    if (id) {
      if (leadId) await setLeadWebhookDelivery(leadId, id);
      enqueueAndFlush(id);
    }
  }
}
