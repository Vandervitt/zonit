// AI 额度充值包（一次性购买，credit 永不过期）。
// 仅用于「AI 整页生成」：当月免费额度用尽后自动消耗 credit。
// 注意：AI 文案改写(rewrite)不消耗 credit —— 当月改写额度用尽只能等次月重置或升级套餐
// （有意的升级驱动，见 lib/ai/usage.ts checkAndConsume 中 kind==="page" 才动 credit）。
// credits 数量必须与收款渠道产品映射一致（env DODO_CREDITS_50 / DODO_CREDITS_200，
// CREEM_CREDITS_50 / CREEM_CREDITS_200），后端据 credits 反查产品 id 建结账会话。

import { approxCnyAmount } from "./pricing/fx";

export interface CreditPack {
  /** 充值额度（同时作为选购标识，与渠道产品映射对齐）。 */
  credits: number;
  /** 展示价（美元，仅展示；实际扣款以渠道产品定价为准）。 */
  priceUsd: number;
  /** 是否标注「更划算」。 */
  highlight?: boolean;
}

// 卖点说明（desc）已移出本文件：它是展示文案，随后台语言变化，
// 现按 credits 数量存放在 lib/i18n/admin/dictionaries/*/billing.ts 的 credits.packDesc。
// 本文件只留结构化事实——与 lib/plans.ts 的分工一致。
export const CREDIT_PACKS: CreditPack[] = [
  { credits: 50, priceUsd: 4.99 },
  { credits: 200, priceUsd: 14.99, highlight: true },
];

/**
 * 充值包价格展示：美元为准，给定汇率时附人民币参考换算。
 *
 * 汇率传 null 即表示该展示面不需要换算（英文界面），调用方无需自己分支——
 * 与 lib/plans.ts 的 approxCnyText 同一约定。
 */
export function creditPackPriceLabel(pack: CreditPack, cnyRate?: number | null): string {
  const approx = cnyRate == null ? null : approxCnyAmount(pack.priceUsd, cnyRate);
  return `$${pack.priceUsd}${approx ? `（约 ¥${approx}）` : ""}`;
}

/** 允许购买的额度档位集合，供路由校验入参。 */
export const CREDIT_PACK_AMOUNTS: ReadonlySet<number> = new Set(CREDIT_PACKS.map((p) => p.credits));
