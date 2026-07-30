// 展示用汇率的取数侧（仅服务端）。
//
// 策略：免密钥的公开汇率接口 + Next 数据缓存按天 revalidate；接口不可用、返回结构
// 变化或数值离谱时一律回落到常量，保证定价页永远能渲染出一个合理数字。
import type { Locale } from "@/lib/i18n/config";
import { USD_TO_CNY_FALLBACK, extractCnyRate } from "./fx";

const FX_ENDPOINT = "https://open.er-api.com/v6/latest/USD";
const FX_REVALIDATE_SECONDS = 86400;

/**
 * 取 USD→CNY 展示汇率。失败静默回落到 {@link USD_TO_CNY_FALLBACK}——
 * 汇率只影响一个参考数字，不值得因第三方抖动让定价页整页报错。
 */
export async function getUsdToCnyRate(): Promise<number> {
  try {
    const res = await fetch(FX_ENDPOINT, { next: { revalidate: FX_REVALIDATE_SECONDS } });
    if (!res.ok) return USD_TO_CNY_FALLBACK;
    return extractCnyRate(await res.json()) ?? USD_TO_CNY_FALLBACK;
  } catch {
    return USD_TO_CNY_FALLBACK;
  }
}

/**
 * 按语言决定是否需要人民币参考换算：英文面直接以美元结算，返回 null 可让英文页
 * 完全跳过这次 fetch，保持纯静态。
 */
export async function getCnyRateForLocale(locale: Locale): Promise<number | null> {
  return locale === "zh" ? getUsdToCnyRate() : null;
}
