import type { Metadata } from "next";
import { guideDetailMetadata, guideStaticParams, GuideDetailView } from "@/components/marketing/pages/GuideDetail";

// 指南为静态注册表：全量 SSG，未知 slug 一律 404。
export const dynamicParams = false;
export const generateStaticParams = guideStaticParams;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return guideDetailMetadata(slug, "zh");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <GuideDetailView slug={slug} locale="zh" />;
}
