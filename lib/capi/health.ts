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

/** 失败原因 → 给投放侧看的人话。missing_credential 是最常见的一种。 */
export function explainCapiError(error: string | null): string | null {
  if (!error) return null;
  if (error === "missing_credential") return "找不到凭据：页级与账号级都没有配置，或配置后被删除";
  if (/401|invalid[_ ]?(access[_ ]?)?token|oauth/i.test(error)) return "Access Token 无效或已过期，需要在平台重新生成";
  if (/permission|scope|forbidden|403/i.test(error)) return "Token 权限不足：缺少该 Dataset / Pixel 的写入权限";
  if (/not[_ ]?found|404|invalid.*(dataset|pixel)/i.test(error)) return "Dataset ID / Pixel Code 填错或已删除";
  if (/rate|429|too many/i.test(error)) return "被平台限流，通常会在重试中自行恢复";
  return null;
}
