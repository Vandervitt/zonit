import { legalMetadata, LegalView } from "@/components/marketing/pages/Legal";

export const metadata = legalMetadata("privacy", "en");

export default function Page() {
  return <LegalView kind="privacy" locale="en" />;
}
