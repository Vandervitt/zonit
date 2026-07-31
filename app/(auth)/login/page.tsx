import { LoginView } from "@/components/auth/LoginView";
import { loginMetadata } from "@/lib/seo/auth-metadata";

export const metadata = loginMetadata("en");

export default function Page() {
  return <LoginView locale="en" />;
}
