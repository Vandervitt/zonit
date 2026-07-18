// 受信任邮箱域名的单一事实源。
// 产品约定：注册/登录仅支持 Google（Gmail）邮箱，登录页也只保留 Google 一种方式。
// auth.ts 的 Credentials/OAuth 校验与 /api/register 接口共用本模块，避免两处漂移。
export const TRUSTED_DOMAINS = ["gmail.com", "googlemail.com"];

export function isTrustedEmail(email?: string | null): boolean {
  if (!email) return false;
  const domain = email.toLowerCase().split("@")[1];
  return TRUSTED_DOMAINS.includes(domain);
}
