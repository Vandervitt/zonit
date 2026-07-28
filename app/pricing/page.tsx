import { pricingMetadata, PricingView } from "@/components/marketing/pages/Pricing";

export const metadata = pricingMetadata("en");

export default function Page() {
  return <PricingView locale="en" />;
}
