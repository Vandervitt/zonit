// 欧盟/EEA 访客判定与第一方埋点采集门控。
//
// CMP 深化（Phase 4.5）：第三方像素本就在 consent 之后才加载；第一方匿名 beacon
// （/api/track）此前对所有访客 mount 即采集。为满足欧盟 GDPR/ePrivacy，对欧盟/EEA
// 访客把第一方采集也纳入同意门控——非欧盟访客保持现状（mount 即采集）。

// EU-27 + EEA（挪威/冰岛/列支敦士登）+ 英国（UK GDPR 同等要求）。
const EEA_COUNTRIES = new Set([
  // EU-27
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR",
  "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL", "PL", "PT", "RO", "SK",
  "SI", "ES", "SE",
  // EEA（非欧盟）
  "IS", "LI", "NO",
  // 英国
  "GB",
]);

/** 按 ISO 3166-1 alpha-2 国家码判定是否属欧盟/EEA/英国。空值按非欧盟处理。 */
export function isEeaCountry(code?: string | null): boolean {
  if (!code) return false;
  return EEA_COUNTRIES.has(code.toUpperCase());
}

/**
 * 第一方 beacon 是否可采集。
 * 非欧盟访客：始终可采集（匿名无 cookie 的必要统计，维持现状）。
 * 欧盟/EEA 访客：仅在访客已同意后采集（未同意/已拒绝均不采集）。
 */
export function shouldCollectFirstParty(euVisitor: boolean, consented: boolean): boolean {
  return !euVisitor || consented;
}
