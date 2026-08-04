// lib/company-profiles/resolve.ts
// 落地页/政策页渲染时把 footer.companyProfileId 解析成页脚上的那一行。
//
// 解析失败（未选、主体已删、跨账号 id）一律返回 undefined —— 页脚就是不展示这一行。
// 刻意不回退到「该账号的默认主体」：那会让「我明明取消了这张页的主体信息」变成
// 悄悄换成另一份，页面上出现客户没选过的法律实体，比缺失更糟。
import { getCompanyProfileForOwner } from "./db";
import { formatCompanyInfo } from "./format";

export async function resolveCompanyInfo(
  profileId: string | undefined,
  ownerId: string,
): Promise<string | undefined> {
  if (!profileId) return undefined;
  const profile = await getCompanyProfileForOwner(profileId, ownerId);
  if (!profile) return undefined;
  const line = formatCompanyInfo(profile);
  return line || undefined;
}
