// app/preview/[token]/policy.tsx
// 预览态的政策子页实现（/preview/{token}/privacy、/terms）。
// 与公开页同构，区别只有两点：token 鉴权取代租户 host 判定，且恒 noindex。
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PolicyDocument } from "@/landing-renderer/PolicyDocument";
import { resolveCompanyInfo } from "@/lib/company-profiles/resolve";
import { loadValidPreview } from "@/lib/preview/load";
import type { PolicyKind } from "@/lib/landing-pages/policy-paths";

/** 预览态的政策链接前缀。政策页自身用它生成「返回落地页」的地址。 */
export function previewPolicyBase(token: string): string {
  return `/preview/${token}`;
}

export async function previewPolicyMetadata(): Promise<Metadata> {
  return { title: "预览 · 政策", robots: { index: false, follow: false } };
}

export async function renderPreviewPolicyPage(
  params: Promise<{ token: string }>,
  kind: PolicyKind,
) {
  const { token } = await params;
  const page = await loadValidPreview(token);
  if (!page) notFound();
  const companyInfo = await resolveCompanyInfo(page.data.footer.companyProfileId, page.user_id);
  return (
    <PolicyDocument
      footer={page.data.footer}
      kind={kind}
      homeHref={previewPolicyBase(token)}
      companyInfo={companyInfo}
    />
  );
}
