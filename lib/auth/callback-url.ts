import { Routes } from "@/lib/constants";

/** 登录/注册页上承载「登录后回到哪里」的查询参数名（与 next-auth 约定一致）。 */
export const CALLBACK_PARAM = "callbackUrl";

const PROBE_ORIGIN = "http://callback.invalid";

/**
 * 只接受站内路径作回跳：以单个 "/" 开头、不含控制字符，且按 URL 解析后仍落在本站。
 * "//evil.com"、"/\evil.com"、绝对地址与伪协议都会被拒（防开放重定向）。
 */
export function safeCallbackPath(raw: string | null | undefined): string | null {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  try {
    if (new URL(raw, PROBE_ORIGIN).origin !== PROBE_ORIGIN) return null;
  } catch {
    return null;
  }
  return raw;
}

/** 登录成功后的落点：合法回跳优先，否则进租户后台（不是营销首页）。 */
export function postLoginTarget(raw: string | null | undefined): string {
  return safeCallbackPath(raw) ?? Routes.Dashboard;
}

/** 给登录/注册入口附上回跳参数；回跳缺失或非法时返回原路径。 */
export function withCallbackUrl(path: string, raw: string | null | undefined): string {
  const callback = safeCallbackPath(raw);
  return callback ? `${path}?${CALLBACK_PARAM}=${encodeURIComponent(callback)}` : path;
}
