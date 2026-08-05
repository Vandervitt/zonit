// CAPI 回传健康度的类型与判读（纯函数，无 DB 依赖）。
//
// ⚠️ 与 events-store.ts 分开：后者 import 了 pg 连接池，后台面板是客户端组件，
// 从那里引类型/常量会把 pg 打进浏览器包。

import type { CapiProviderId } from "./types";

/** 单个 provider 的回传健康度。 */
export interface CapiProviderHealth {
  provider: CapiProviderId;
  sent: number;
  /** 仍在重试队列里的（未达上限）。 */
  pending: number;
  /** 重试到上限仍未成功的终态失败。 */
  failed: number;
  /** 最近一条失败原因与时间——「失败了」不可行动，「凭据过期」才可行动。 */
  lastError: string | null;
  lastErrorAt: string | null;
}

/**
 * 判读结论。
 * - idle：区间内没有回传（没配、没线索，或套餐不含）
 * - healthy：有成交且无终态失败
 * - degraded：有终态失败，但多数仍送达
 * - failing：终态失败占了settled 的一半以上——基本等于凭据/配置有问题
 */
export type CapiVerdict = "idle" | "healthy" | "degraded" | "failing";

export interface CapiHealthSummary {
  verdict: CapiVerdict;
  /** 送达率 = 已发送 / 已定局（已发送 + 终态失败）。pending 还没定局，不计入分母。 */
  deliveryRate: number;
  sent: number;
  pending: number;
  failed: number;
}

export function summarizeCapiHealth(rows: CapiProviderHealth[]): CapiHealthSummary {
  const sent = rows.reduce((n, r) => n + r.sent, 0);
  const pending = rows.reduce((n, r) => n + r.pending, 0);
  const failed = rows.reduce((n, r) => n + r.failed, 0);
  const settled = sent + failed;
  const deliveryRate = settled > 0 ? sent / settled : 0;
  let verdict: CapiVerdict = "healthy";
  if (sent + pending + failed === 0) verdict = "idle";
  else if (failed > 0 && deliveryRate < 0.5) verdict = "failing";
  else if (failed > 0) verdict = "degraded";
  return { verdict, deliveryRate, sent, pending, failed };
}

/** 可解释的失败原因。文案在字典的 analytics.capiHealth.reasons（同名键）。 */
export type CapiErrorReason =
  | "missingCredential"
  | "invalidToken"
  | "insufficientScope"
  | "wrongDataset"
  | "rateLimited";

/**
 * 平台返回的原始错误 → 可解释的原因键。
 *
 * 只回键不回文案：这段结论要显示在分析页上，随后台界面语言变化。
 * 认不出的错误回 null，由展示层只显示平台原文——编一句可能不准的解释更糟。
 */
export function explainCapiError(error: string | null): CapiErrorReason | null {
  if (!error) return null;
  if (error === "missing_credential") return "missingCredential";
  if (/401|invalid[_ ]?(access[_ ]?)?token|oauth/i.test(error)) return "invalidToken";
  if (/permission|scope|forbidden|403/i.test(error)) return "insufficientScope";
  if (/not[_ ]?found|404|invalid.*(dataset|pixel)/i.test(error)) return "wrongDataset";
  if (/rate|429|too many/i.test(error)) return "rateLimited";
  return null;
}
