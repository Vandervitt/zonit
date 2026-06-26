// lib/capi/providers/meta.ts
// Meta Conversions API 适配。
import type { CapiProvider, CapiEvent, CapiCredential, CapiSendResult } from "../types";

const GRAPH_VERSION = "v21.0";

function dropEmpty<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}

export const metaProvider: CapiProvider = {
  id: "meta",
  eventName: "Lead",

  buildPayload(ev: CapiEvent, _cred: CapiCredential) {
    const user_data = dropEmpty({
      em: ev.emailHash ? [ev.emailHash] : undefined,
      ph: ev.phoneHash ? [ev.phoneHash] : undefined,
      fbp: ev.fbp,
      fbc: ev.fbc,
      client_ip_address: ev.clientIp,
      client_user_agent: ev.userAgent,
    });
    return {
      data: [
        dropEmpty({
          event_name: ev.eventName,
          event_time: ev.eventTime,
          event_id: ev.eventId,
          action_source: "website",
          event_source_url: ev.sourceUrl,
          user_data,
        }),
      ],
    };
  },

  async send(body: unknown, cred: CapiCredential): Promise<CapiSendResult> {
    const url = `https://graph.facebook.com/${GRAPH_VERSION}/${cred.externalId}/events?access_token=${encodeURIComponent(cred.accessToken)}`;
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false, error: `meta ${res.status}: ${text.slice(0, 300)}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "meta network error" };
    }
  },
};
