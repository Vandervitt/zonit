import { rfqMetadata, RfqView } from "@/components/marketing/pages/Rfq";

export const metadata = rfqMetadata("en");

export default function Page() {
  return <RfqView locale="en" />;
}
