import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { TrackingProvider } from "@/landing-renderer/tracking/TrackingProvider";
import { hostnameOf, isAppHost } from "@/lib/host";
import { resolvePageMeta } from "@/lib/seo/resolve";

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

  const { footer } = page.data;
  const { title, description, ogImage, noindex } = resolvePageMeta(page.data);

  // 已发布页只在租户自有域名根路径可达 → canonical 指向该域名根路径。
  const host = hostnameOf((await headers()).get("host"));
  const canonical = `https://${host}/`;

  return {
    title,
    description,
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

  return (
    <TrackingProvider tracking={page.data.tracking} pageId={page.id}>
      <LandingPage page={page.data} pageId={page.id} />
    </TrackingProvider>
  );
}
