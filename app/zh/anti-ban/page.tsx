import { antiBanMetadata, AntiBanView } from "@/components/marketing/pages/AntiBan";

export const metadata = antiBanMetadata("zh");

export default function Page() {
  return <AntiBanView locale="zh" />;
}
