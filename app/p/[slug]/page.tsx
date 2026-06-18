import { headers } from "next/headers";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { getPublishedBySlug } from "@/lib/landing-pages/store";
import { TrackingProvider } from "@/landing-renderer/tracking/TrackingProvider";
import { hostnameOf, isAppHost } from "@/lib/host";

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
  const title = page.data.hero.title.replace(/\n/g, " ");
  return { title, description: page.data.hero.subtitle };
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
