import type { Metadata } from "next";
import {
  pageCheckReportMetadata,
  PageCheckReportView,
} from "@/components/marketing/pages/PageCheckReport";

// 报告按 id 实时读库；不预渲染，且一律 noindex（见组件内注释）。
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return pageCheckReportMetadata(id, "zh");
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PageCheckReportView id={id} locale="zh" />;
}
