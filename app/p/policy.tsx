// app/p/policy.tsx
// 租户政策子页（/privacy、/terms）的渲染与元数据。
//
// 访客看到的地址是客户域名下的 `/privacy` 或 `/invisalign/privacy`；
// app/p/page.tsx 解析出它挂在哪张落地页下（及落地页所在路径）后调用这里。
import type { Metadata } from "next";
import { PolicyDocument } from "@/landing-renderer/PolicyDocument";
import { resolveCompanyInfo } from "@/lib/company-profiles/resolve";
import type { LandingPageRow } from "@/lib/landing-pages/store";
import type { PolicyKind } from "@/lib/landing-pages/policy-paths";

const TITLES: Record<PolicyKind, string> = {
  privacy: "Privacy Policy",
  terms: "Terms of Service",
};

/**
 * 政策页恒 noindex：正文与落地页页脚同源，被索引就是一份跨租户的薄重复内容。
 * 平台要求的是「访客与审核能打开」，从不要求它被搜索引擎收录。
 */
export function tenantPolicyMetadata(page: LandingPageRow, kind: PolicyKind): Metadata {
  return {
    title: `${TITLES[kind]} · ${page.data.footer.brandName}`,
    robots: { index: false, follow: false },
  };
}

export async function renderTenantPolicyPage(page: LandingPageRow, kind: PolicyKind, landingPath: string) {
  const companyInfo = await resolveCompanyInfo(page.data.footer.companyProfileId, page.user_id);

  return (
    <PolicyDocument
      footer={page.data.footer}
      kind={kind}
      homeHref={landingPath}
      companyInfo={companyInfo}
    />
  );
}
