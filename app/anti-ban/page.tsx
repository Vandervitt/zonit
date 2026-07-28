import { antiBanMetadata, AntiBanView } from "@/components/marketing/pages/AntiBan";

export const metadata = antiBanMetadata("en");

export default function Page() {
  return <AntiBanView locale="en" />;
}
