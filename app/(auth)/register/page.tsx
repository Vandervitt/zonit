import { RegisterView } from "@/components/auth/RegisterView";
import { registerMetadata } from "@/lib/seo/auth-metadata";

export const metadata = registerMetadata("en");

export default function Page() {
  return <RegisterView locale="en" />;
}
