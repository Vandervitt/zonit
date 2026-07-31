import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { TrackingProvider } from "@/landing-renderer/tracking/TrackingProvider";
import { Watermark } from "@/landing-renderer/Watermark";
import { isAppHost, resolveTenantHostname, resolveTenantPath } from "@/lib/host";
import { resolvePageMeta } from "@/lib/seo/resolve";
import { getUserPlan } from "@/lib/plans-db";
import { hasWatermark, hasAntiBan } from "@/lib/plans";
import { gateTrackingByPlan } from "@/lib/tracking/gate";
import { isEeaCountry } from "@/lib/tracking/geo";
import { dialCodeFor } from "@/lib/leads/dial-codes";
import { deriveVariant, IDENTITY_VARIANT } from "@/landing-renderer/variant";
import { JsonLd } from "@/components/seo/JsonLd";
import { landingFaqJsonLd, landingOrganizationJsonLd } from "@/lib/seo/landing-jsonld";

async function isAppHostDirect(): Promise<boolean> {
  return isAppHost(resolveTenantHostname(await headers()));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) return {};

  const plan = await getUserPlan(page.user_id);
  const variant = hasAntiBan(plan) ? deriveVariant(page.data.variantSeed ?? page.id) : IDENTITY_VARIANT;

  const { footer } = page.data;
  const { title, description, ogImage, noindex } = resolvePageMeta(page.data);

  // canonical 必须是访客看到的真实地址：改写后 pathname 已变成 /p/{slug}，
  // 故取中间件透传的原始路径（多路径发布后可能是 /invisalign 而非根）。
  const h = await headers();
  const host = resolveTenantHostname(h);
  const canonical = `https://${host}${resolveTenantPath(h)}`;

  return {
    title,
    description,
    generator: variant.metaToken || undefined,
    alternates: { canonical },
    icons: page.data.branding?.favicon ? { icon: page.data.branding.favicon } : undefined,
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: "website",
      url: canonical,
      siteName: footer.brandName,
      title,
      description,
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export default async function PublicLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // app 主域直连不提供页面托管：客户页面只经自有域名或平台子域访问（两者都不是 appHost）
  if (await isAppHostDirect()) notFound();

  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) notFound();

  // 按 owner 套餐门控：free/starter 只放行 Meta 客户端 pixel，并挂水印。
  const plan = await getUserPlan(page.user_id);
  const tracking = gateTrackingByPlan(page.data.tracking, plan);
  const variant = hasAntiBan(plan) ? deriveVariant(page.data.variantSeed ?? page.id) : IDENTITY_VARIANT;

  // CMP 欧盟门控：按 Vercel 边缘 geo 头判定访客地区，欧盟/EEA 访客的第一方埋点随同意门控。
  const visitorCountry = (await headers()).get("x-vercel-ip-country");
  const euVisitor = isEeaCountry(visitorCountry);

  // 留资表单的默认国码同样按访客 IP 预选：访客手填的号码普遍省略国码，
  // 强制携带才能保证线索落库即 E.164（后台一键联系与客户自己拨号都依赖它）。
  // 全量国码表只在服务端 bundle，客户端由 LeadForm 按需 import()。
  const defaultDial = dialCodeFor(visitorCountry);

  // 结构化数据（SEO 富媒体 + GEO）：注入租户品牌/域名实体，noindex 页不输出。
  const noindex = page.data.seo?.noindex === true;
  const h = await headers();
  const pageUrl = `https://${resolveTenantHostname(h)}${resolveTenantPath(h)}`;
  const faqJsonLd = noindex ? null : landingFaqJsonLd(page.data);
  const orgJsonLd = noindex ? null : landingOrganizationJsonLd(page.data, pageUrl);

  return (
    <>
      {faqJsonLd && <JsonLd data={faqJsonLd} />}
      {orgJsonLd && <JsonLd data={orgJsonLd} />}
      <TrackingProvider tracking={tracking} pageId={page.id} euVisitor={euVisitor}>
        <LandingPage page={page.data} pageId={page.id} variant={variant} defaultDial={defaultDial} />
        {hasWatermark(plan) && <Watermark />}
      </TrackingProvider>
    </>
  );
}
