import type { Metadata } from "next";
import { LoginView } from "@/components/auth/LoginView";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: getDictionary("en").auth.login.metaTitle };

export default function Page() {
  return <LoginView locale="en" />;
}
