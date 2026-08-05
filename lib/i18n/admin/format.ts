// 后台的日期/数字格式化。
//
// 存在的理由：后台的日期渲染此前有三条互不相干的路径——antd ConfigProvider 的 locale、
// dayjs 全局 locale（全仓从未设置过）、以及散落的裸 `new Date(x).toLocaleString()`。
// 第三条不受前两条影响，格式随运行环境漂移，国际化时最容易被漏掉。
// 本模块把第三条收敛成一处，后台任何地方要显示时间都走这里。
import type { Locale } from "../config";

/** Intl 的 BCP 47 标签。与 htmlLang 分开：那个是给 <html lang> 用的，语义不同。 */
const INTL_LOCALE: Record<Locale, string> = { en: "en-US", zh: "zh-CN" };

export function formatDateTime(value: string | number | Date, locale: Locale): string {
  return new Date(value).toLocaleString(INTL_LOCALE[locale]);
}

export function formatDate(value: string | number | Date, locale: Locale): string {
  return new Date(value).toLocaleDateString(INTL_LOCALE[locale]);
}

/** 只要月日的紧凑写法（如套餐到期标签），中文出「8月5日」、英文出「Aug 5」。 */
export function formatMonthDay(value: string | number | Date, locale: Locale): string {
  return new Date(value).toLocaleDateString(INTL_LOCALE[locale], {
    month: locale === "zh" ? "numeric" : "short",
    day: "numeric",
  });
}
