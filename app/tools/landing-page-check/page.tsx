import type { Metadata } from "next";
import { pageCheckMetadata, PageCheckView } from "@/components/marketing/pages/PageCheck";

export function generateMetadata(): Metadata {
  return pageCheckMetadata("en");
}

export default function Page() {
  return <PageCheckView locale="en" />;
}
