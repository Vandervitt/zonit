import type { Metadata } from "next";
import {
  templateDetailMetadata,
  templateStaticParams,
  TemplateDetailView,
} from "@/components/marketing/pages/TemplateDetail";

// 模板集为静态注册表：全量 SSG，未知 slug 一律 404。
export const dynamicParams = false;
export const generateStaticParams = templateStaticParams;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  return templateDetailMetadata(slug, "zh");
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <TemplateDetailView slug={slug} locale="zh" />;
}
