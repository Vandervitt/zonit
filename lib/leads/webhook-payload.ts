// 线索 webhook 出站 JSON 契约（对外稳定，勿随意改字段名）。
export interface LeadWebhookInput {
  pageId: string;
  pageName: string;
  fields: Record<string, unknown>;
  channel: string | null;
  utm: { utm_source?: string | null; utm_medium?: string | null; utm_campaign?: string | null };
  createdAt: string;
}

export interface LeadWebhookPayload {
  event: "lead.created";
  created_at: string;
  page: { id: string; name: string };
  channel: string | null;
  fields: Record<string, unknown>;
  utm: { source: string | null; medium: string | null; campaign: string | null };
}

export function buildLeadWebhookPayload(input: LeadWebhookInput): LeadWebhookPayload {
  return {
    event: "lead.created",
    created_at: input.createdAt,
    page: { id: input.pageId, name: input.pageName },
    channel: input.channel ?? null,
    fields: input.fields,
    utm: {
      source: input.utm.utm_source ?? null,
      medium: input.utm.utm_medium ?? null,
      campaign: input.utm.utm_campaign ?? null,
    },
  };
}
