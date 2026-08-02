import type { Metadata } from "next";
import {
  templateIndustryMetadata,
  industryStaticParams,
  TemplateIndustryView,
} from "@/components/marketing/pages/TemplateIndustry";

// 行业集合来自静态注册表：全量 SSG，未知行业一律 404。
export const dynamicParams = false;
export const generateStaticParams = industryStaticParams;

export async function generateMetadata({ params }: { params: Promise<{ category: string }> }): Promise<Metadata> {
  const { category } = await params;
  return templateIndustryMetadata(category, "zh");
}

export default async function Page({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  return <TemplateIndustryView category={category} locale="zh" />;
}
