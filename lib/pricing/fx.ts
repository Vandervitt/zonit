// 展示用汇率的**纯逻辑**部分（校验 / 解析 / 换算），可安全进客户端包。
// 实际取数在 fx-server.ts —— 拆开是为了不把服务端 fetch 配置带进客户端 bundle。
//
// 收款货币是 USD，实际扣款金额以 Dodo / Creem 产品配置为准；本模块产出的人民币
// 数字**只是给中文访客的参考**，任何展示处都必须带「约」字样，不得当作结算金额。

/** 接口不可用时的兜底汇率（人工维护，更新于 2026-07-30）。 */
export const USD_TO_CNY_FALLBACK = 7.1;

/** 汇率合理区间：超出即视为脏数据，避免第三方异常把页面价格放大到荒谬数量级。 */
const RATE_MIN = 5;
const RATE_MAX = 10;

/** 校验第三方返回的汇率：必须是有限数且落在合理区间内。 */
export function isSaneRate(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= RATE_MIN && value <= RATE_MAX;
}

/** 从接口响应体里取 USD→CNY；任何形状不符都返回 null，交由调用方回落。 */
export function extractCnyRate(payload: unknown): number | null {
  const rate = (payload as { rates?: Record<string, unknown> } | null)?.rates?.CNY;
  return isSaneRate(rate) ? rate : null;
}

/**
 * 美元金额换算为人民币展示串（取整到元，无货币符号）。0 元不展示换算。
 * 向下截断、只舍不入（项目数值约定）；「约」后面跟到分既别扭，也容易被读成结算金额。
 * 加一个极小量抵消浮点误差（如 x.9999999 被截成 x-1）。
 */
export function approxCnyAmount(usd: number, rate: number): string | null {
  if (usd <= 0 || !isSaneRate(rate)) return null;
  return Math.floor(usd * rate + 1e-9).toLocaleString("en-US");
}
