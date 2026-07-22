// AI 额度充值包（一次性购买，credit 永不过期，月额度用尽后自动消耗）。
// credits 数量必须与收款渠道产品映射一致（env DODO_CREDITS_50 / DODO_CREDITS_200，
// CREEM_CREDITS_50 / CREEM_CREDITS_200），后端据 credits 反查产品 id 建结账会话。

export interface CreditPack {
  /** 充值额度（同时作为选购标识，与渠道产品映射对齐）。 */
  credits: number;
  /** 展示价（仅展示，实际扣款以渠道产品定价为准）。 */
  priceText: string;
  /** 卖点说明。 */
  desc: string;
  /** 是否标注「更划算」。 */
  highlight?: boolean;
}

export const CREDIT_PACKS: CreditPack[] = [
  { credits: 50, priceText: "$19.99", desc: "适合偶尔补量" },
  { credits: 200, priceText: "$59.99", desc: "单价更低，重度使用推荐", highlight: true },
];

/** 允许购买的额度档位集合，供路由校验入参。 */
export const CREDIT_PACK_AMOUNTS: ReadonlySet<number> = new Set(CREDIT_PACKS.map((p) => p.credits));
