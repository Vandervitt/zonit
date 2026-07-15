import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { TrackingProvider } from "@/landing-renderer/tracking/TrackingProvider";
import { Watermark } from "@/landing-renderer/Watermark";
import { hostnameOf, isAppHost } from "@/lib/host";
import { resolvePageMeta } from "@/lib/seo/resolve";
import { getUserPlan } from "@/lib/plans-db";
import { hasWatermark, hasAntiBan } from "@/lib/plans";
import { gateTrackingByPlan } from "@/lib/tracking/gate";
import { deriveVariant, IDENTITY_VARIANT } from "@/landing-renderer/variant";

async function isAppHostDirect(): Promise<boolean> {
  return isAppHost(hostnameOf((await headers()).get("host")));
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

  // 已发布页只在租户自有域名根路径可达 → canonical 指向该域名根路径。
  const host = hostnameOf((await headers()).get("host"));
  const canonical = `https://${host}/`;

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
  // 贯彻「只发布到自有域名」：app 域名直连不提供公共托管
  if (await isAppHostDirect()) notFound();

  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) notFound();

  // 按 owner 套餐门控：free/starter 只放行 Meta 客户端 pixel，并挂水印。
  const plan = await getUserPlan(page.user_id);
  const tracking = gateTrackingByPlan(page.data.tracking, plan);
  const variant = hasAntiBan(plan) ? deriveVariant(page.data.variantSeed ?? page.id) : IDENTITY_VARIANT;

  return (
    <TrackingProvider tracking={tracking} pageId={page.id}>
      <LandingPage page={page.data} pageId={page.id} variant={variant} />
      {hasWatermark(plan) && <Watermark />}
    </TrackingProvider>
  );
}
