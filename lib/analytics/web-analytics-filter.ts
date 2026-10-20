import type { BeforeSendEvent } from "@vercel/analytics/next";

// 运营者自己的访问（后台、超管、编辑器预览）会被 Web Analytics 按天重复计为访客，
// 污染营销站漏斗口径，故在上报前丢弃。
const OPERATOR_PREFIXES = ["/admin", "/super-admin", "/preview"];

export function isOperatorPath(pathname: string): boolean {
  return OPERATOR_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function webAnalyticsBeforeSend(event: BeforeSendEvent): BeforeSendEvent | null {
  let pathname: string;
  try {
    pathname = new URL(event.url).pathname;
  } catch {
    return event;
  }
  return isOperatorPath(pathname) ? null : event;
}
