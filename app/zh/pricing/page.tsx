import { pricingMetadata, PricingView } from "@/components/marketing/pages/Pricing";

export const metadata = pricingMetadata("zh");

export default function Page() {
  return <PricingView locale="zh" />;
}
