import { legalMetadata, LegalView } from "@/components/marketing/pages/Legal";

export const metadata = legalMetadata("terms", "zh");

export default function Page() {
  return <LegalView kind="terms" locale="zh" />;
}
