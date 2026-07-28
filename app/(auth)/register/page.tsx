import type { Metadata } from "next";
import { RegisterView } from "@/components/auth/RegisterView";
import { getDictionary } from "@/lib/i18n/dictionaries";

export const metadata: Metadata = { title: getDictionary("en").auth.register.metaTitle };

export default function Page() {
  return <RegisterView locale="en" />;
}
