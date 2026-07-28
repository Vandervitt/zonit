import { guideIndexMetadata, GuideIndexView } from "@/components/marketing/pages/GuideIndex";

export const metadata = guideIndexMetadata("en");

export default function Page() {
  return <GuideIndexView locale="en" />;
}
