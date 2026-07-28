import { guideIndexMetadata, GuideIndexView } from "@/components/marketing/pages/GuideIndex";

export const metadata = guideIndexMetadata("zh");

export default function Page() {
  return <GuideIndexView locale="zh" />;
}
