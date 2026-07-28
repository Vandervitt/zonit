import { homeMetadata, HomeView } from "@/components/marketing/pages/Home";

export const metadata = homeMetadata("en");

export default function Page() {
  return <HomeView locale="en" />;
}
