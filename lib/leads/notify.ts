// 线索通知编排：查 owner（email + 设置 + 套餐）→ 邮件（全档，开关+有邮箱）+ webhook（套餐允许+开关+URL）。
import pool from "@/lib/db";
import { after } from "next/server";
import { getUserPlan } from "@/lib/plans-db";
import { hasLeadWebhook } from "@/lib/plans";
import { sendLeadNotificationEmail } from "@/lib/email";
import { buildLeadWebhookPayload, type LeadWebhookInput } from "./webhook-payload";
import { insertDelivery } from "@/lib/webhooks/deliveries-store";
import { enqueueAndFlush } from "@/lib/webhooks/dispatch";

interface OwnerCtx {
  userId: string; email: string | null; pageName: string;
  email_enabled: boolean; webhook_enabled: boolean; webhook_url: string | null;
}

async function getOwnerCtx(pageId: string): Promise<OwnerCtx | null> {
  const res = await pool.query(
    `SELECT p.user_id, p.name AS page_name, u.email,
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
    userId: r.user_id, email: r.email, pageName: r.page_name,
    email_enabled: r.email_enabled, webhook_enabled: r.webhook_enabled, webhook_url: r.webhook_url,
  };
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

  if (decision.email && ctx.email) {
    const to = ctx.email;
    after(async () => {
      await sendLeadNotificationEmail({
        to, pageName: ctx.pageName, fields: input.fields, dashboardUrl: input.dashboardUrl,
      });
    });
  }

  if (decision.webhook) {
    const payload = buildLeadWebhookPayload({
      pageId: input.pageId, pageName: ctx.pageName, fields: input.fields,
      channel: input.channel, utm: input.utm, createdAt: input.createdAt,
    });
    const id = await insertDelivery({ userId: ctx.userId, pageId: input.pageId, payload: payload as unknown as Record<string, unknown> });
    if (id) enqueueAndFlush(id);
  }
}
