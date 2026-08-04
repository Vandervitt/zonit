// lib/company-profiles/format.ts
// 经营主体 → 页脚上的那一行。纯函数，无 IO，可单测（渲染器与政策页共用）。

export interface CompanyProfileFields {
  legal_name: string;
  address: string;
  registration_no: string;
  license: string;
}

/**
 * 成文的主体信息行，如：
 * `Acme Aesthetics Ltd · 12 King Street, London W1 · Company No. 12345678 · License HCA-2291`
 *
 * 前缀固定英文：生成页面向海外访客与海外平台审核，与渲染器其余缺省文案同口径
 * （见 landing-renderer/sections/LeadForm.tsx 的 FIELD_LABELS 注释）。
 * 空字段整段省略，不留「Company No. —」这种半截信息。
 */
export function formatCompanyInfo(p: CompanyProfileFields): string {
  const parts = [
    p.legal_name.trim(),
    p.address.trim(),
    p.registration_no.trim() ? `Company No. ${p.registration_no.trim()}` : "",
    p.license.trim() ? `License ${p.license.trim()}` : "",
  ].filter(Boolean);
  return parts.join(" · ");
}
