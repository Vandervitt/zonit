import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { TrackingProvider } from "@/landing-renderer/tracking/TrackingProvider";
import { hostnameOf, isAppHost } from "@/lib/host";
import type { HeroSection } from "@/types/schema.draft";

async function isAppHostDirect(): Promise<boolean> {
  return isAppHost(hostnameOf((await headers()).get("host")));
}

/** 从首屏派生 OG 预览图：优先背景图，其次展示图（视频取封面）。 */
function heroOgImage(hero: HeroSection): string | undefined {
  if (hero.backgroundImage?.src) return hero.backgroundImage.src;
  if (hero.showcase?.type === "image") return hero.showcase.src;
  if (hero.showcase?.type === "video") return hero.showcase.poster;
  return undefined;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const page = await getPublishedBySlug(slug);
  if (!page) return {};

  const { hero, footer } = page.data;
  const title = hero.title.replace(/\n/g, " ");
  const description = hero.subtitle;

  // 已发布页只在租户自有域名根路径可达 → canonical 指向该域名根路径。
  const host = hostnameOf((await headers()).get("host"));
  const canonical = `https://${host}/`;
  const ogImage = heroOgImage(hero);

  return {
    title,
    description,
    alternates: { canonical },
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
    <TrackingProvider tracking={page.data.tracking}>
      <LandingPage page={page.data} />
    </TrackingProvider>
  );
}
