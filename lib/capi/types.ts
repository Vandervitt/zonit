// lib/capi/types.ts
// CAPI 骨架公共类型与 provider 接口。
export type CapiProviderId = "meta" | "tiktok";

export interface CapiCredential {
  provider: CapiProviderId;
  accessToken: string;
  externalId: string; // Meta dataset id / TikTok pixel code
}

/** 待回传事件（PII 已哈希；不含明文）。 */
export interface CapiEvent {
  eventName: string; // 'Lead'(meta) / 'SubmitForm'(tiktok)
  eventId: string;   // 与客户端 pixel 共享，去重
  emailHash?: string;
  phoneHash?: string;
  fbp?: string;
  fbc?: string;
  ttp?: string;
  ttclid?: string;
  clientIp?: string;
  userAgent?: string;
  eventTime: number; // 秒级 unix 时间
  sourceUrl?: string;
}

export interface CapiSendResult {
  ok: boolean;
  error?: string;
}

export interface CapiProvider {
  readonly id: CapiProviderId;
  /** 该 provider 的转化事件名（Meta=Lead / TikTok=SubmitForm）。 */
  readonly eventName: string;
  buildPayload(ev: CapiEvent, cred: CapiCredential): unknown;
  send(body: unknown, cred: CapiCredential): Promise<CapiSendResult>;
}
