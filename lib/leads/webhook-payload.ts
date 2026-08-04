// 线索 webhook 出站 JSON 契约（对外稳定，勿随意改字段名）。
export interface LeadWebhookInput {
  pageId: string;
  pageName: string;
  fields: Record<string, unknown>;
  channel: string | null;
  utm: LeadWebhookUtmInput;
  createdAt: string;
}

/** 与 LeadAttribution 同形（多余键无害），便于调用方直接透传归因对象。 */
export interface LeadWebhookUtmInput {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_term?: string | null;
  utm_content?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  ttclid?: string | null;
}

export interface LeadWebhookPayload {
  event: "lead.created";
  created_at: string;
  page: { id: string; name: string };
  channel: string | null;
  fields: Record<string, unknown>;
  utm: { source: string | null; medium: string | null; campaign: string | null; term: string | null; content: string | null };
  /** 平台点击 ID，供接收方与广告后台对账。三者可同时存在（跨平台透传）。 */
  click_ids: { gclid: string | null; fbclid: string | null; ttclid: string | null };
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
      term: input.utm.utm_term ?? null,
      content: input.utm.utm_content ?? null,
    },
    click_ids: {
      gclid: input.utm.gclid ?? null,
      fbclid: input.utm.fbclid ?? null,
      ttclid: input.utm.ttclid ?? null,
    },
  };
}
