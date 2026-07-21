import { getFounderContact } from "@/lib/platform-settings";
import { AdminProviders } from "./_shell/AdminProviders";
import { AdminShell } from "./_shell/AdminShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const founderContact = await getFounderContact();
  return (
    <AdminProviders>
      <AdminShell founderContact={founderContact}>{children}</AdminShell>
    </AdminProviders>
  );
}
