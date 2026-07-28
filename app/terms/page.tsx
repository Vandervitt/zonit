import { legalMetadata, LegalView } from "@/components/marketing/pages/Legal";

export const metadata = legalMetadata("terms", "en");

export default function Page() {
  return <LegalView kind="terms" locale="en" />;
}
