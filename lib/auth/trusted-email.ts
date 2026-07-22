// 邮箱校验的单一事实源。
// 产品已放开：注册/登录支持任意邮箱后缀（配合邮箱验证码 OTP 证明归属），
// 不再限制 Gmail。此处只做基础格式校验；归属真实性由 OTP 验证保证。
//
// 历史：曾用 TRUSTED_DOMAINS 白名单仅允许 Gmail，现已废弃。

/** 基础邮箱格式校验：非空、单个 @、两侧非空、含点的域名、无空白。 */
export function isValidEmailFormat(email?: string | null): boolean {
  if (!email) return false;
  const trimmed = email.trim();
  // 保守但足够的格式：本地部分@域名.顶级域，禁止空白。
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}
