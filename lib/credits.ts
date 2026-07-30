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
  /** 卖点说明。 */
  desc: string;
  /** 是否标注「更划算」。 */
  highlight?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { credits: 50, priceUsd: 4.99, desc: "适合偶尔补量" },
  { credits: 200, priceUsd: 14.99, desc: "单价更低，重度使用推荐", highlight: true },
];

/**
 * 充值包价格展示：美元为准，给定汇率时附人民币参考换算。
 * 后台固定中文，故换算文案在此直接写死，不走 i18n 字典。
 */
export function creditPackPriceLabel(pack: CreditPack, cnyRate?: number | null): string {
  const approx = cnyRate == null ? null : approxCnyAmount(pack.priceUsd, cnyRate);
  return `$${pack.priceUsd}${approx ? `（约 ¥${approx}）` : ""}`;
}

/** 允许购买的额度档位集合，供路由校验入参。 */
export const CREDIT_PACK_AMOUNTS: ReadonlySet<number> = new Set(CREDIT_PACKS.map((p) => p.credits));
