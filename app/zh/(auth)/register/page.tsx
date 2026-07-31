import { RegisterView } from "@/components/auth/RegisterView";
import { registerMetadata } from "@/lib/seo/auth-metadata";

export const metadata = registerMetadata("zh");

export default function Page() {
  return <RegisterView locale="zh" />;
}
