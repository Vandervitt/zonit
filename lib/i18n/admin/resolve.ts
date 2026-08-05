// 后台界面语言的解析口径。与营销面的语言判定（lib/proxy/locale-proxy.ts）是两套东西：
// 那边是匿名访客的一次性 IP 分流，只作用于首页；这边是登录用户的账号级偏好。
import { defaultLocale, isLocale, type Locale } from "../config";

/**
 * 按优先级解析后台语言：**用户显式选择 > 注册来源 > 默认语言**。
 *
 * - `userLocale`：`users.locale`。用户在设置页选过、或存量用户被迁移 046 钉成 'zh'。
 * - `cookieLocale`：营销站的 `zb_locale`。新用户刚注册完，浏览器还带着他浏览营销站时
 *   的语言，用它兜底比直接落到 defaultLocale 更贴近用户预期。
 *
 * 非法值一律跳过而不是抛错：这一列可能被历史数据或人工改库写脏，
 * 后台语言不该因为一个脏值就整个打不开。
 */
export function resolveAdminLocale(
  userLocale: string | null | undefined,
  cookieLocale: string | null | undefined,
): Locale {
  if (userLocale && isLocale(userLocale)) return userLocale;
  if (cookieLocale && isLocale(cookieLocale)) return cookieLocale;
  return defaultLocale;
}
