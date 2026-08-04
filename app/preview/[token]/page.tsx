import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { Watermark } from "@/landing-renderer/Watermark";
import { getUserPlan } from "@/lib/plans-db";
import { hasAntiBan } from "@/lib/plans";
import { deriveVariant, IDENTITY_VARIANT } from "@/landing-renderer/variant";
import { loadValidPreview } from "@/lib/preview/load";
import { previewPolicyBase } from "./policy";
import { resolveCompanyInfo } from "@/lib/company-profiles/resolve";
import { resolvePageMeta } from "@/lib/seo/resolve";

// 预览页永远 noindex（叠加 next.config 的 X-Robots-Tag 头）；不派生 OG/canonical，避免被分享抓取当正式页。
export async function generateMetadata({ params }: { params: Promise<{ token: string }> }): Promise<Metadata> {
  const { token } = await params;
  const page = await loadValidPreview(token);
  const title = page ? `预览 · ${resolvePageMeta(page.data).title}` : "预览";
  return { title, robots: { index: false, follow: false } };
}

export default async function PreviewByToken({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const page = await loadValidPreview(token);
  if (!page) notFound();

  // 预览忠实反映发布后外观：按 owner 套餐派生反同质化变体（与公开页一致）。
  // 但：强制水印（与套餐无关）、不挂 TrackingProvider（预览不产生投放数据）。
  const plan = await getUserPlan(page.user_id);
  const variant = hasAntiBan(plan) ? deriveVariant(page.data.variantSeed ?? page.id) : IDENTITY_VARIANT;
  // 政策链接在预览里也要真能点开：客户就是在这里第一次检查页脚的。
  const companyInfo = await resolveCompanyInfo(page.data.footer.companyProfileId, page.user_id);

  return (
    <>
      <LandingPage
        page={page.data}
        pageId={page.id}
        variant={variant}
        preview
        policyBase={previewPolicyBase(token)}
        companyInfo={companyInfo}
      />
      <Watermark />
    </>
  );
}
