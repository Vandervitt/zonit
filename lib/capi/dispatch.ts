// lib/capi/dispatch.ts
// 派发器：把 lead 转化入队为 capi_events，并发送（即时 / cron）。
import { after } from "next/server";
import type { CapiCredential, CapiEvent, CapiProviderId } from "./types";
import { getProvider } from "./providers";
import { hashEmail, hashPhone } from "./hash";
import * as store from "./events-store";
import type { CapiEventRow } from "./events-store";
import { getCredentials } from "./credentials";

/** flushOne 的可注入依赖（便于单测）。 */
export interface FlushDeps {
  getCredentials: (pageId: string) => Promise<CapiCredential[]>;
  send: (body: unknown, cred: CapiCredential) => Promise<{ ok: boolean; error?: string }>;
  markSent: (id: string) => Promise<void>;
  markFailure: (id: string, attempts: number, error: string) => Promise<void>;
}

const defaultDeps: FlushDeps = {
  getCredentials,
  send: (body, cred) => getProvider(cred.provider).send(body, cred),
  markSent: store.markSent,
  markFailure: store.markFailure,
};

/** 发送单条事件并更新状态。 */
export async function flushOne(row: CapiEventRow, deps: FlushDeps = defaultDeps): Promise<void> {
  const creds = await deps.getCredentials(row.page_id);
  const cred = creds.find((c) => c.provider === row.provider);
  if (!cred) {
    await deps.markFailure(row.id, row.attempts, "missing_credential");
    return;
  }
  const provider = getProvider(row.provider);
  const body = provider.buildPayload(row.payload as unknown as CapiEvent, cred);
  const res = await deps.send(body, cred);
  if (res.ok) await deps.markSent(row.id);
  else await deps.markFailure(row.id, row.attempts, res.error ?? "send_failed");
}

/** 批量发送（cron / 即时）。 */
export async function flushEvents(rows: CapiEventRow[]): Promise<void> {
  for (const row of rows) await flushOne(row);
}

export interface LeadContext {
  email?: string;
  phone?: string;
  eventId: string;
  fbp?: string; fbc?: string; ttp?: string; ttclid?: string;
  clientIp?: string; userAgent?: string; sourceUrl?: string;
  consent: boolean;
}

/**
 * 为该 page 已配凭据的 provider 入队 CAPI 事件，并在响应后即时 flush 一次。
 * consent=false 直接跳过（与客户端 pixel 行为一致）。
 */
export async function enqueueCapiEvents(pageId: string, ctx: LeadContext): Promise<void> {
  if (!ctx.consent) return;
  const creds = await getCredentials(pageId);
  if (creds.length === 0) return;

  const emailHash = hashEmail(ctx.email);
  const phoneHash = hashPhone(ctx.phone);
  const eventTime = Math.floor(Date.now() / 1000);
  const ids: string[] = [];

  for (const cred of creds) {
    const provider = getProvider(cred.provider);
    const payload: CapiEvent = {
      eventName: provider.eventName,
      eventId: ctx.eventId,
      emailHash, phoneHash,
      fbp: cred.provider === "meta" ? ctx.fbp : undefined,
      fbc: cred.provider === "meta" ? ctx.fbc : undefined,
      ttp: cred.provider === "tiktok" ? ctx.ttp : undefined,
      ttclid: cred.provider === "tiktok" ? ctx.ttclid : undefined,
      clientIp: ctx.clientIp,
      userAgent: ctx.userAgent,
      eventTime,
      sourceUrl: ctx.sourceUrl,
    };
    const id = await store.insertEvent({
      pageId, provider: cred.provider as CapiProviderId, eventName: provider.eventName,
      eventId: ctx.eventId, payload: payload as unknown as Record<string, unknown>,
    });
    if (id) ids.push(id);
  }

  // 即时 flush（响应后异步，不阻塞用户）。
  if (ids.length > 0) {
    after(async () => {
      const rows = await store.getEventsByIds(ids);
      await flushEvents(rows);
    });
  }
}
