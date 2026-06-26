// lib/capi/providers/tiktok.ts
// TikTok Events API 适配。
import type { CapiProvider, CapiEvent, CapiCredential, CapiSendResult } from "../types";

const ENDPOINT = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

function dropEmpty<T extends Record<string, unknown>>(obj: T): T {
  for (const k of Object.keys(obj)) if (obj[k] === undefined) delete obj[k];
  return obj;
}

export const tiktokProvider: CapiProvider = {
  id: "tiktok",
  eventName: "SubmitForm",

  buildPayload(ev: CapiEvent, cred: CapiCredential) {
    const user = dropEmpty({
      email: ev.emailHash ? [ev.emailHash] : undefined,
      phone: ev.phoneHash ? [ev.phoneHash] : undefined,
      ttp: ev.ttp,
      ttclid: ev.ttclid,
      ip: ev.clientIp,
      user_agent: ev.userAgent,
    });
    return {
      event_source: "web",
      event_source_id: cred.externalId,
      data: [
        dropEmpty({
          event: ev.eventName,
          event_time: ev.eventTime,
          event_id: ev.eventId,
          user,
          page: ev.sourceUrl ? { url: ev.sourceUrl } : undefined,
        }),
      ],
    };
  },

  async send(body: unknown, cred: CapiCredential): Promise<CapiSendResult> {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Access-Token": cred.accessToken },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return { ok: false, error: `tiktok ${res.status}: ${text.slice(0, 300)}` };
      }
      // TikTok 200 也可能 code!=0；读 code 判定
      const json = (await res.json().catch(() => null)) as { code?: number; message?: string } | null;
      if (json && typeof json.code === "number" && json.code !== 0) {
        return { ok: false, error: `tiktok code ${json.code}: ${json.message ?? ""}` };
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : "tiktok network error" };
    }
  },
};
