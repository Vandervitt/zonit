import { LoginView } from "@/components/auth/LoginView";
import { loginMetadata } from "@/lib/seo/auth-metadata";

export const metadata = loginMetadata("zh");

export default function Page() {
  return <LoginView locale="zh" />;
}
