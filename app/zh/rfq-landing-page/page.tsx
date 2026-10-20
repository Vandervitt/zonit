import { rfqMetadata, RfqView } from "@/components/marketing/pages/Rfq";

export const metadata = rfqMetadata("zh");

export default function Page() {
  return <RfqView locale="zh" />;
}
