// lib/webhooks/dispatch.ts
// 出站 webhook 派发器：把入队投递发送到租户配置的 URL（即时 / cron），并更新状态机。
import { after } from "next/server";
import { signWebhookBody } from "./sign";
import * as store from "./deliveries-store";
import type { WebhookDeliveryRow } from "./deliveries-store";
import { getLeadNotifySettings } from "@/lib/leads/notify-settings";

export interface DeliveryTarget { url: string; secret: string; enabled: boolean }

/** deliverOne 的可注入依赖（便于单测）。 */
export interface DeliveryDeps {
  getTarget: (userId: string) => Promise<DeliveryTarget | null>;
  post: (url: string, body: string, signature: string) => Promise<{ ok: boolean; error?: string }>;
  markSent: (id: string) => Promise<void>;
  markFailure: (id: string, attempts: number, error: string) => Promise<void>;
}

/** 出站 POST：15s 超时，2xx 视为成功。 */
async function httpPost(url: string, body: string, signature: string): Promise<{ ok: boolean; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Zonit-Signature": signature, "User-Agent": "Zonit-Webhook/1" },
      body,
      signal: ctrl.signal,
    });
    return res.ok ? { ok: true } : { ok: false, error: `http_${res.status}` };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.name : "fetch_error" };
  } finally {
    clearTimeout(timer);
  }
}

const defaultDeps: DeliveryDeps = {
  getTarget: async (userId) => {
    const s = await getLeadNotifySettings(userId);
    if (!s.webhook_enabled || !s.webhook_url || !s.webhook_secret) return null;
    return { url: s.webhook_url, secret: s.webhook_secret, enabled: true };
  },
  post: httpPost,
  markSent: store.markSent,
  markFailure: store.markFailure,
};

/** 投递单条并更新状态。 */
export async function deliverOne(row: WebhookDeliveryRow, deps: DeliveryDeps = defaultDeps): Promise<void> {
  const target = await deps.getTarget(row.user_id);
  if (!target) { await deps.markFailure(row.id, row.attempts, "no_target"); return; }
  const body = JSON.stringify(row.payload);
  const signature = signWebhookBody(body, target.secret);
  const res = await deps.post(target.url, body, signature);
  if (res.ok) await deps.markSent(row.id);
  else await deps.markFailure(row.id, row.attempts, res.error ?? "send_failed");
}

/** 批量投递（cron / 即时）。 */
export async function deliverMany(rows: WebhookDeliveryRow[]): Promise<void> {
  for (const row of rows) await deliverOne(row);
}

/** 入队并在响应后即时投一次。 */
export function enqueueAndFlush(id: string): void {
  after(async () => {
    const rows = await store.getDeliveriesByIds([id]);
    await deliverMany(rows);
  });
}
