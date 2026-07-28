import { legalMetadata, LegalView } from "@/components/marketing/pages/Legal";

export const metadata = legalMetadata("privacy", "zh");

export default function Page() {
  return <LegalView kind="privacy" locale="zh" />;
}
