// 构建期从 Dodo 产品定价生成展示价快照的**纯逻辑**部分（校验 / 组装），不引 SDK 运行时。
// 取数入口在 scripts/sync-dodo-prices.ts；产物是 lib/pricing/prices.json，
// lib/plans.ts 与 lib/credits.ts 从它读价格，页面上不再出现手写数字。
//
// 校验从严：任何会让「官网展示价 ≠ 结账页扣款价」的形态（非美元、周期不符、带折扣、
// 按需付费）一律报错，交给构建脚本决定是中止构建还是沿用旧快照。
// 年付价与月费的倍数**不做约束**：定价由运营在 Dodo 后台自由调整，展示侧按实际价格算节省额。

/** Dodo Product 里与取价相关的最小形状（与 SDK 的 Product 结构兼容）。 */
export interface ProductPriceLike {
  product_id?: string;
  price: {
    type: string;
    currency: string;
    price?: number;
    discount?: number;
    payment_frequency_count?: number;
    payment_frequency_interval?: string;
    pay_what_you_want?: boolean;
  };
}

export type PriceKind = "monthly" | "yearly" | "one_time";

export type PaidPlanId = "pro" | "agency";
export const PAID_PLAN_IDS: readonly PaidPlanId[] = ["pro", "agency"];

/** 计费周期。 */
export type BillingInterval = "month" | "year";
export const BILLING_INTERVALS: readonly BillingInterval[] = ["month", "year"];
export type CreditPackKey = "50" | "200";

/** prices.json 的结构：金额一律存美分整数，避免浮点误差；换算成美元在读取侧做。 */
export interface PriceSnapshot {
  currency: "USD";
  plans: Record<PaidPlanId, Record<BillingInterval, number>>;
  credits: Record<CreditPackKey, number>;
}

export interface PriceProductIds {
  plans: Record<PaidPlanId, Record<BillingInterval, string>>;
  credits: Record<CreditPackKey, string>;
}

/** 从单个产品取美分价；形态不符合展示假设时抛错。 */
export function extractUsdCents(product: ProductPriceLike, kind: PriceKind): number {
  const p = product.price;
  const expectedType = kind === "one_time" ? "one_time_price" : "recurring_price";
  if (p.type !== expectedType) throw new Error(`expected ${expectedType}, got ${p.type}`);
  if (p.currency !== "USD") throw new Error(`expected USD, got ${p.currency}`);
  if (kind === "monthly" && (p.payment_frequency_interval !== "Month" || p.payment_frequency_count !== 1)) {
    throw new Error(`expected billing every 1 month, got every ${p.payment_frequency_count} ${p.payment_frequency_interval}`);
  }
  if (kind === "yearly" && (p.payment_frequency_interval !== "Year" || p.payment_frequency_count !== 1)) {
    throw new Error(`expected billing every 1 year, got every ${p.payment_frequency_count} ${p.payment_frequency_interval}`);
  }
  if (p.pay_what_you_want) throw new Error("pay_what_you_want products have no fixed price");
  if (p.discount) throw new Error(`discount ${p.discount}% is not supported for display`);
  if (!Number.isInteger(p.price) || (p.price as number) <= 0) throw new Error(`invalid price: ${p.price}`);
  return p.price as number;
}

/** 按产品 id 逐个取价组装快照；任一产品失败即整体失败，错误信息带上是哪一档。 */
export async function fetchPriceSnapshot(
  retrieve: (productId: string) => Promise<ProductPriceLike>,
  ids: PriceProductIds,
): Promise<PriceSnapshot> {
  const priceOf = async (label: string, productId: string, kind: PriceKind): Promise<number> => {
    try {
      return extractUsdCents(await retrieve(productId), kind);
    } catch (err) {
      throw new Error(`${label} (${productId}): ${err instanceof Error ? err.message : String(err)}`);
    }
  };
  const planPrices = async (plan: PaidPlanId): Promise<Record<BillingInterval, number>> => {
    const [month, year] = await Promise.all([
      priceOf(`plans.${plan}.month`, ids.plans[plan].month, "monthly"),
      priceOf(`plans.${plan}.year`, ids.plans[plan].year, "yearly"),
    ]);
    return { month, year };
  };
  const [pro, agency, c50, c200] = await Promise.all([
    planPrices("pro"),
    planPrices("agency"),
    priceOf("credits.50", ids.credits["50"], "one_time"),
    priceOf("credits.200", ids.credits["200"], "one_time"),
  ]);
  return { currency: "USD", plans: { pro, agency }, credits: { "50": c50, "200": c200 } };
}

/** 美分 → 美元展示数值（599 → 5.99）。 */
export function centsToUsd(cents: number): number {
  return cents / 100;
}
