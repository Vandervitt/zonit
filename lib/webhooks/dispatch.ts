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
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** 出站 POST：15s 超时，2xx 视为成功。 */
async function httpPost(url: string, body: string, signature: string): Promise<{ ok: boolean; error?: string }> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 15_000);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Zap-Bridge-Signature": signature, "User-Agent": "Zap-Bridge-Webhook/1" },
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

/**
 * 投递单条并更新状态。opts.retries 为「本轮内部快速退避重试次数」（默认 0）：
 * 即时链路用 >0 覆盖目标端秒级抖动（GC 暂停 / 短暂 502 / 连接重置），仅当本轮所有尝试
 * 都失败才记一次 markFailure——attempts 语义是「投递轮次」而非「HTTP 请求次数」，
 * 故内部重试不会快速耗尽 MAX_ATTEMPTS，长时间宕机仍留给 cron 逐轮兜底。no_target 不重试。
 */
export async function deliverOne(
  row: WebhookDeliveryRow,
  deps: DeliveryDeps = defaultDeps,
  opts: { retries?: number } = {},
): Promise<void> {
  const target = await deps.getTarget(row.user_id);
  if (!target) { await deps.markFailure(row.id, row.attempts, "no_target"); return; }
  const body = JSON.stringify(row.payload);
  const signature = signWebhookBody(body, target.secret);
  const retries = opts.retries ?? 0;
  const sleep = deps.sleep ?? defaultSleep;
  let lastError = "send_failed";
  for (let i = 0; i <= retries; i++) {
    const res = await deps.post(target.url, body, signature);
    if (res.ok) { await deps.markSent(row.id); return; }
    lastError = res.error ?? "send_failed";
    if (i < retries) await sleep(1000 * 2 ** i); // 退避 1s、2s、4s…
  }
  await deps.markFailure(row.id, row.attempts, lastError);
}

/** 批量投递（cron / 即时）。 */
export async function deliverMany(rows: WebhookDeliveryRow[]): Promise<void> {
  for (const row of rows) await deliverOne(row);
}

/** 入队并在响应后即时投递：带内部短退避重试，覆盖目标端秒级抖动；仍失败留给 cron 兜底。 */
export function enqueueAndFlush(id: string): void {
  after(async () => {
    const rows = await store.getDeliveriesByIds([id]);
    for (const row of rows) await deliverOne(row, defaultDeps, { retries: 2 });
  });
}
