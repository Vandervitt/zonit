import { homeMetadata, HomeView } from "@/components/marketing/pages/Home";

export const metadata = homeMetadata("zh");

export default function Page() {
  return <HomeView locale="zh" />;
}
