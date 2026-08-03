import type { Metadata } from "next";
import { pageCheckMetadata, PageCheckView } from "@/components/marketing/pages/PageCheck";

export function generateMetadata(): Metadata {
  return pageCheckMetadata("zh");
}

export default function Page() {
  return <PageCheckView locale="zh" />;
}
